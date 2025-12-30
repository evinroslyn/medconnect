import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, from } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import { IndexedDBService } from '../storage/indexeddb.service';
import { WebSocketService } from '../websocket/websocket.service';
import { HttpClient } from '@angular/common/http';
import { API_CONFIG } from '../config/api.config';

/**
 * Service de synchronisation pour gérer les données offline/online
 */
@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor(
    private indexedDB: IndexedDBService,
    private webSocket: WebSocketService,
    private http: HttpClient
  ) {
    // Écouter les changements de statut réseau
    window.addEventListener('online', () => {
      console.log('🌐 Connexion réseau rétablie');
      this.isOnline = true;
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Connexion réseau perdue');
      this.isOnline = false;
    });

    // Initialiser IndexedDB
    this.indexedDB.init().subscribe({
      next: () => {
        console.log('✅ SyncService initialisé');
        // Synchroniser au démarrage si en ligne
        if (this.isOnline) {
          setTimeout(() => this.syncAll(), 1000);
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'initialisation de SyncService:', error);
      }
    });
  }

  /**
   * Vérifier si l'application est en ligne
   */
  isOnlineMode(): boolean {
    return this.isOnline;
  }

  /**
   * Synchroniser toutes les données
   */
  syncAll(): Observable<boolean> {
    if (!this.isOnline) {
      console.log('📴 Mode offline, synchronisation reportée');
      return of(false);
    }

    if (this.syncInProgress) {
      console.log('⏳ Synchronisation déjà en cours');
      return of(false);
    }

    this.syncInProgress = true;
    console.log('🔄 Début de la synchronisation...');

    return forkJoin({
      messages: this.syncMessages(),
      rendezVous: this.syncRendezVous(),
      disponibilites: this.syncDisponibilites(),
      patients: this.syncPatients(),
      conversations: this.syncConversations(),
      pending: this.syncPendingOperations()
    }).pipe(
      tap(() => {
        console.log('✅ Synchronisation terminée');
        this.syncInProgress = false;
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la synchronisation:', error);
        this.syncInProgress = false;
        return of(false);
      }),
      map(() => true)
    );
  }

  /**
   * Synchroniser les messages
   */
  private syncMessages(): Observable<boolean> {
    return this.indexedDB.getUnsynced('messages').pipe(
      switchMap(unsyncedMessages => {
        if (unsyncedMessages.length === 0) {
          return of(true);
        }

        const syncOperations = unsyncedMessages.map((message: any) =>
          this.http.post(`${API_CONFIG.BASE_URL}/messages`, message).pipe(
            tap(() => {
              this.indexedDB.markAsSynced('messages', message.id).subscribe();
            }),
            catchError(error => {
              console.error('❌ Erreur lors de la synchronisation du message:', error);
              return of(null);
            })
          )
        );

        return forkJoin(syncOperations).pipe(map(() => true));
      })
    );
  }

  /**
   * Synchroniser les rendez-vous
   */
  private syncRendezVous(): Observable<boolean> {
    return this.indexedDB.getUnsynced('rendezVous').pipe(
      switchMap(unsyncedRendezVous => {
        if (unsyncedRendezVous.length === 0) {
          return of(true);
        }

        const syncOperations = unsyncedRendezVous.map((rendezVous: any) =>
          this.http.post(`${API_CONFIG.BASE_URL}/rendez-vous`, rendezVous).pipe(
            tap(() => {
              this.indexedDB.markAsSynced('rendezVous', rendezVous.id).subscribe();
            }),
            catchError(error => {
              console.error('❌ Erreur lors de la synchronisation du rendez-vous:', error);
              return of(null);
            })
          )
        );

        return forkJoin(syncOperations).pipe(map(() => true));
      })
    );
  }

  /**
   * Synchroniser les disponibilités
   */
  private syncDisponibilites(): Observable<boolean> {
    return this.indexedDB.getUnsynced('disponibilites').pipe(
      switchMap(unsyncedDisponibilites => {
        if (unsyncedDisponibilites.length === 0) {
          return of(true);
        }

        const syncOperations = unsyncedDisponibilites.map((disponibilite: any) =>
          this.http.post(`${API_CONFIG.BASE_URL}/rendez-vous/disponibilites`, disponibilite).pipe(
            tap(() => {
              this.indexedDB.markAsSynced('disponibilites', disponibilite.id).subscribe();
            }),
            catchError(error => {
              console.error('❌ Erreur lors de la synchronisation de la disponibilité:', error);
              return of(null);
            })
          )
        );

        return forkJoin(syncOperations).pipe(map(() => true));
      })
    );
  }

  /**
   * Synchroniser les patients
   */
  private syncPatients(): Observable<boolean> {
    return this.indexedDB.getUnsynced('patients').pipe(
      switchMap(unsyncedPatients => {
        if (unsyncedPatients.length === 0) {
          return of(true);
        }

        // Les patients sont généralement en lecture seule côté médecin
        // Cette méthode peut être étendue selon les besoins
        return of(true);
      })
    );
  }

  /**
   * Synchroniser les conversations
   */
  private syncConversations(): Observable<boolean> {
    return this.indexedDB.getUnsynced('conversations').pipe(
      switchMap(unsyncedConversations => {
        if (unsyncedConversations.length === 0) {
          return of(true);
        }

        // Les conversations sont généralement synchronisées automatiquement
        return of(true);
      })
    );
  }

  /**
   * Synchroniser les opérations en attente
   */
  private syncPendingOperations(): Observable<boolean> {
    return this.indexedDB.getPendingOperations().pipe(
      switchMap(operations => {
        if (operations.length === 0) {
          return of(true);
        }

        const syncOperations = operations.map((operation: any) => {
          let httpCall: Observable<any>;

          switch (operation.action) {
            case 'create':
              httpCall = this.http.post(`${API_CONFIG.BASE_URL}/${operation.storeName}`, operation.data);
              break;
            case 'update':
              httpCall = this.http.patch(`${API_CONFIG.BASE_URL}/${operation.storeName}/${operation.data.id}`, operation.data);
              break;
            case 'delete':
              httpCall = this.http.delete(`${API_CONFIG.BASE_URL}/${operation.storeName}/${operation.data.id}`);
              break;
            default:
              return of(null);
          }

          return httpCall.pipe(
            tap(() => {
              this.indexedDB.removePendingOperation(operation.id).subscribe();
            }),
            catchError(error => {
              console.error(`❌ Erreur lors de la synchronisation de l'opération ${operation.type}:`, error);
              return of(null);
            })
          );
        });

        return forkJoin(syncOperations).pipe(map(() => true));
      })
    );
  }

  /**
   * Forcer une synchronisation manuelle
   */
  forceSync(): Observable<boolean> {
    return this.syncAll();
  }

  /**
   * Obtenir le statut de synchronisation
   */
  getSyncStatus(): {
    isOnline: boolean;
    syncInProgress: boolean;
  } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }
}

