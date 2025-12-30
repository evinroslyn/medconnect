import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { API_CONFIG } from '../../infrastructure/config/api.config';
import { Message, Conversation } from '../../domain/models';
import { WebSocketService, WebSocketEventType } from '../../infrastructure/websocket/websocket.service';
import { IndexedDBService } from '../../infrastructure/storage/indexeddb.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { SyncService } from '../../infrastructure/sync/sync.service';

/**
 * Interface pour envoyer un message
 */
export interface SendMessageData {
  destinataireId: string;
  contenu: string;
}

/**
 * Service amélioré pour la gestion des messages avec WebSocket, cache et offline
 */
@Injectable({
  providedIn: 'root'
})
export class MessageServiceEnhanced {
  private readonly API_BASE_URL = `${API_CONFIG.BASE_URL}`;

  constructor(
    private http: HttpClient,
    private webSocket: WebSocketService,
    private indexedDB: IndexedDBService,
    private cacheService: CacheService,
    private syncService: SyncService
  ) {
    // Écouter les nouveaux messages via WebSocket
    this.webSocket.onEvent(WebSocketEventType.MESSAGE).subscribe(event => {
      const message = event.data;
      // Mettre en cache le nouveau message
      this.indexedDB.add('messages', { ...message, synced: true }).subscribe();
      // Invalider le cache des conversations
      this.cacheService.invalidate('/messages/conversations');
    });
  }

  /**
   * Envoie un message (avec support offline)
   */
  sendMessage(data: SendMessageData): Observable<Message> {
    const messageId = `temp_${Date.now()}`;
    const tempMessage: Message = {
      id: messageId,
      emetteurId: '', // Sera rempli par le backend
      destinataireId: data.destinataireId,
      contenu: data.contenu,
      dateEnvoi: new Date().toISOString(),
      lu: false
    };

    // Si offline, sauvegarder localement et synchroniser plus tard
    if (!this.syncService.isOnlineMode()) {
      return this.indexedDB.add('messages', { ...tempMessage, synced: false }).pipe(
        tap(() => {
          // Ajouter une opération en attente
          this.indexedDB.addPendingOperation({
            type: 'message',
            action: 'create',
            storeName: 'messages',
            data: data
          }).subscribe();
        }),
        map(() => tempMessage)
      );
    }

    // Si online, envoyer via HTTP et WebSocket
    return this.http.post<Message>(`${this.API_BASE_URL}/messages`, data).pipe(
      tap(message => {
        // Sauvegarder localement
        this.indexedDB.add('messages', { ...message, synced: true }).subscribe();
        // Envoyer via WebSocket pour notification en temps réel
        this.webSocket.send(WebSocketEventType.MESSAGE, message);
        // Invalider le cache
        this.cacheService.invalidate('/messages/conversations');
      }),
      catchError(error => {
        // En cas d'erreur, sauvegarder localement pour synchronisation ultérieure
        this.indexedDB.add('messages', { ...tempMessage, synced: false }).subscribe();
        this.indexedDB.addPendingOperation({
          type: 'message',
          action: 'create',
          storeName: 'messages',
          data: data
        }).subscribe();
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère toutes les conversations (avec cache)
   */
  getConversations(): Observable<Conversation[]> {
    const cacheKey = '/messages/conversations';

    return this.cacheService.cacheObservable(
      cacheKey,
      this.http.get<Conversation[]>(`${this.API_BASE_URL}/messages/conversations`).pipe(
        tap(conversations => {
          // Sauvegarder localement
          conversations.forEach(conv => {
            this.indexedDB.add('conversations', { ...conv, synced: true }).subscribe();
          });
        }),
        catchError(error => {
          // En cas d'erreur, essayer de récupérer depuis IndexedDB
          if (!this.syncService.isOnlineMode()) {
            return this.indexedDB.getAll<Conversation>('conversations');
          }
          return throwError(() => error);
        })
      )
    );
  }

  /**
   * Récupère les messages d'une conversation (avec cache et offline)
   */
  getConversation(patientId: string): Observable<Message[]> {
    const cacheKey = `/messages/conversations/${patientId}`;

    return this.cacheService.cacheObservable(
      cacheKey,
      this.http.get<Message[]>(`${this.API_BASE_URL}/messages/conversations/${patientId}`).pipe(
        tap(messages => {
          // Sauvegarder localement
          messages.forEach(msg => {
            this.indexedDB.add('messages', { ...msg, synced: true }).subscribe();
          });
        }),
        catchError(error => {
          // En cas d'erreur, essayer de récupérer depuis IndexedDB
          if (!this.syncService.isOnlineMode()) {
            return this.indexedDB.getAll<Message>('messages').pipe(
              map(allMessages => allMessages.filter(msg => 
                msg.emetteurId === patientId || msg.destinataireId === patientId
              ))
            );
          }
          return throwError(() => error);
        })
      )
    );
  }

  /**
   * Marque un message comme lu
   */
  markAsRead(messageId: string): Observable<void> {
    return this.http.patch<void>(`${this.API_BASE_URL}/messages/${messageId}/read`, {}).pipe(
      tap(() => {
        // Mettre à jour localement
        this.indexedDB.get('messages', messageId).pipe(
          switchMap(message => {
            if (message) {
              return this.indexedDB.add('messages', { ...message, lu: true, synced: true });
            }
            return of(null);
          })
        ).subscribe();
        // Invalider le cache
        this.cacheService.invalidate('/messages');
      }),
      catchError(error => {
        // En cas d'erreur, sauvegarder l'opération pour synchronisation ultérieure
        if (!this.syncService.isOnlineMode()) {
          this.indexedDB.addPendingOperation({
            type: 'message',
            action: 'update',
            storeName: 'messages',
            data: { id: messageId, lu: true }
          }).subscribe();
        }
        return throwError(() => error);
      })
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Erreur dans MessageService:', error);
    return throwError(() => error);
  }
}

