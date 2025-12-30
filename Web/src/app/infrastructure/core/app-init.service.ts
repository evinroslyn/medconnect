import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { IndexedDBService } from '../storage/indexeddb.service';
import { WebSocketService } from '../websocket/websocket.service';
import { SyncService } from '../sync/sync.service';
import { CacheService } from '../cache/cache.service';
import { AuthService } from '@/application/services/auth.service';

/**
 * Service d'initialisation de l'application
 * Initialise tous les services nécessaires au démarrage
 */
@Injectable({
  providedIn: 'root'
})
export class AppInitService {
  constructor(
    private indexedDB: IndexedDBService,
    private webSocket: WebSocketService,
    private syncService: SyncService,
    private cacheService: CacheService,
    private authService: AuthService
  ) {}

  /**
   * Initialiser l'application
   */
  init(): Observable<boolean> {
    console.log('🚀 Initialisation de l\'application...');

    return forkJoin({
      indexedDB: this.indexedDB.init().pipe(
        catchError(error => {
          console.error('❌ Erreur lors de l\'initialisation d\'IndexedDB:', error);
          return of(false);
        })
      ),
      cache: of(this.initCache()).pipe(
        catchError(error => {
          console.error('❌ Erreur lors de l\'initialisation du cache:', error);
          return of(false);
        })
      )
    }).pipe(
      tap(results => {
        console.log('✅ Services initialisés:', results);

        // Connecter WebSocket si l'utilisateur est authentifié
        // Note: Le WebSocket se connectera automatiquement, mais s'arrêtera si le serveur n'est pas disponible
        if (this.authService.isAuthenticated()) {
          console.log('🔌 Tentative de connexion WebSocket...');
          // Délai pour éviter les tentatives trop rapides au démarrage
          setTimeout(() => {
            this.webSocket.connect();
          }, 2000);
        }

        // Nettoyer le cache expiré toutes les minutes
        setInterval(() => {
          this.cacheService.cleanExpired();
        }, 60 * 1000);
      }),
      map(() => true),
      catchError(error => {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        return of(false);
      })
    );
  }

  /**
   * Initialiser le cache
   */
  private initCache(): boolean {
    // Nettoyer les entrées expirées au démarrage
    this.cacheService.cleanExpired();
    return true;
  }
}

