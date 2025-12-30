import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API_CONFIG } from '../../infrastructure/config/api.config';
import { Message, Conversation } from '../../domain/models';

/**
 * Interface pour envoyer un message
 */
export interface SendMessageData {
  destinataireId: string;
  contenu: string;
}

/**
 * Service pour la gestion des messages (messagerie sécurisée)
 */
@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly API_BASE_URL = `${API_CONFIG.BASE_URL}`;

  constructor(private http: HttpClient) {}

  /**
   * Envoie un message
   */
  sendMessage(data: SendMessageData): Observable<Message> {
    return this.http.post<Message>(
      `${this.API_BASE_URL}/messages`,
      data
    ).pipe(
      map(message => ({
        ...message,
        confirmationDeLecture: message.lu || message.confirmationDeLecture || false,
        dateEnvoi: typeof message.dateEnvoi === 'string' ? message.dateEnvoi : message.dateEnvoi.toISOString()
      })),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère toutes les conversations
   */
  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.API_BASE_URL}/messages/conversations`)
      .pipe(
        map(conversations => (conversations || []).map(conv => ({
          ...conv,
          dernierMessage: {
            ...conv.dernierMessage,
            dateEnvoi: typeof conv.dernierMessage.dateEnvoi === 'string' 
              ? conv.dernierMessage.dateEnvoi 
              : (conv.dernierMessage.dateEnvoi as Date).toISOString()
          }
        }))),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère une conversation avec un utilisateur spécifique
   */
  getConversation(autreUtilisateurId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.API_BASE_URL}/messages/conversation/${autreUtilisateurId}`)
      .pipe(
        map(messages => (messages || []).map(msg => ({
          ...msg,
          confirmationDeLecture: msg.lu !== undefined ? msg.lu : (msg.confirmationDeLecture || false),
          dateEnvoi: typeof msg.dateEnvoi === 'string' ? msg.dateEnvoi : (msg.dateEnvoi as Date).toISOString()
        }))),
        catchError(this.handleError)
      );
  }

  /**
   * Marque un message comme lu
   */
  markAsRead(messageId: string): Observable<void> {
    return this.http.patch<void>(`${this.API_BASE_URL}/messages/${messageId}/read`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gestionnaire d'erreurs
   */
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  };
}

