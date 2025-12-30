# Guide d'Implémentation - Services Avancés

Ce document décrit comment utiliser les services avancés implémentés dans l'application.

## 🎯 Vue d'Ensemble

Trois services principaux ont été implémentés pour améliorer l'expérience utilisateur :

1. **WebSocketService** : Communication en temps réel
2. **SyncService** : Synchronisation offline/online
3. **CacheService** : Optimisation des appels API

## 📡 WebSocket - Communication en Temps Réel

### Configuration Backend Requise

Le backend doit implémenter un serveur WebSocket qui :

1. Accepte les connexions sur `ws://localhost:3000`
2. Authentifie via token JWT dans l'URL : `ws://localhost:3000?token=<jwt_token>`
3. Envoie des messages au format :
```json
{
  "type": "message|rendez-vous|disponibilite|notification",
  "data": { ... },
  "timestamp": 1234567890
}
```

### Exemple d'Intégration dans un Composant

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService, WebSocketEventType } from '@/infrastructure/websocket/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html'
})
export class ChatComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();

  constructor(private webSocket: WebSocketService) {}

  ngOnInit() {
    // Se connecter au WebSocket
    this.webSocket.connect();

    // Écouter les nouveaux messages
    const messageSub = this.webSocket.onEvent(WebSocketEventType.MESSAGE)
      .subscribe(event => {
        console.log('Nouveau message:', event.data);
        // Mettre à jour l'UI
      });
    this.subscriptions.add(messageSub);

    // Écouter les nouveaux rendez-vous
    const rendezVousSub = this.webSocket.onEvent(WebSocketEventType.RENDEZ_VOUS)
      .subscribe(event => {
        console.log('Nouveau rendez-vous:', event.data);
        // Rafraîchir la liste des rendez-vous
      });
    this.subscriptions.add(rendezVousSub);

    // Surveiller le statut de connexion
    const statusSub = this.webSocket.connectionStatus$
      .subscribe(isConnected => {
        if (isConnected) {
          console.log('WebSocket connecté');
        } else {
          console.log('WebSocket déconnecté');
        }
      });
    this.subscriptions.add(statusSub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  sendMessage(content: string) {
    // Envoyer via WebSocket pour notification en temps réel
    this.webSocket.send(WebSocketEventType.MESSAGE, {
      contenu: content,
      destinataireId: 'patient-id'
    });
  }
}
```

## 💾 Synchronisation Offline

### Utilisation dans un Service

```typescript
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { IndexedDBService } from '@/infrastructure/storage/indexeddb.service';
import { SyncService } from '@/infrastructure/sync/sync.service';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class MyService {
  constructor(
    private http: HttpClient,
    private indexedDB: IndexedDBService,
    private sync: SyncService
  ) {}

  getData(): Observable<any[]> {
    // Si offline, récupérer depuis IndexedDB
    if (!this.sync.isOnlineMode()) {
      return this.indexedDB.getAll('myData');
    }

    // Si online, récupérer depuis l'API et sauvegarder localement
    return this.http.get('/api/data').pipe(
      switchMap(data => {
        // Sauvegarder chaque élément localement
        const savePromises = data.map(item => 
          this.indexedDB.add('myData', { ...item, synced: true }).toPromise()
        );
        return Promise.all(savePromises).then(() => data);
      }),
      catchError(error => {
        // En cas d'erreur, essayer de récupérer depuis IndexedDB
        return this.indexedDB.getAll('myData');
      })
    );
  }

  createData(data: any): Observable<any> {
    const tempId = `temp_${Date.now()}`;
    const tempData = { ...data, id: tempId, synced: false };

    // Sauvegarder localement immédiatement
    this.indexedDB.add('myData', tempData).subscribe();

    // Si offline, ajouter à la file d'attente
    if (!this.sync.isOnlineMode()) {
      this.indexedDB.addPendingOperation({
        type: 'myData',
        action: 'create',
        storeName: 'myData',
        data: data
      }).subscribe();
      return of(tempData);
    }

    // Si online, envoyer à l'API
    return this.http.post('/api/data', data).pipe(
      switchMap(savedData => {
        // Mettre à jour avec les données du serveur
        this.indexedDB.add('myData', { ...savedData, synced: true }).subscribe();
        return of(savedData);
      }),
      catchError(error => {
        // En cas d'erreur, garder la version locale
        return of(tempData);
      })
    );
  }
}
```

## 📦 Cache - Optimisation des Appels API

### Utilisation avec CacheService

```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CacheService } from '@/infrastructure/cache/cache.service';

@Injectable({ providedIn: 'root' })
export class MyService {
  constructor(
    private http: HttpClient,
    private cache: CacheService
  ) {}

  // Méthode 1 : Utiliser cacheObservable
  getData(): Observable<any[]> {
    const cacheKey = '/api/data';
    return this.cache.cacheObservable(
      cacheKey,
      this.http.get<any[]>(cacheKey),
      { ttl: 10 * 60 * 1000 } // 10 minutes
    );
  }

  // Méthode 2 : Cache manuel
  getDataManual(): Observable<any[]> {
    const cacheKey = '/api/data';
    
    // Vérifier le cache
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) {
      return of(cached);
    }

    // Récupérer depuis l'API et mettre en cache
    return this.http.get<any[]>(cacheKey).pipe(
      tap(data => {
        this.cache.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes
      })
    );
  }

  // Invalider le cache lors d'une modification
  updateData(id: string, data: any): Observable<any> {
    return this.http.put(`/api/data/${id}`, data).pipe(
      tap(() => {
        // Invalider le cache
        this.cache.invalidate('/api/data');
      })
    );
  }
}
```

### L'Intercepteur HTTP Automatique

L'intercepteur `CacheInterceptor` met automatiquement en cache toutes les requêtes GET :

- ✅ Les réponses GET sont mises en cache automatiquement
- ✅ Le cache est invalidé lors des requêtes POST/PUT/DELETE
- ✅ TTL par défaut : 5 minutes

## 🔄 Flux Complet : Exemple avec Messages

```typescript
import { Component, OnInit } from '@angular/core';
import { MessageServiceEnhanced } from '@/application/services/message.service.enhanced';
import { WebSocketService, WebSocketEventType } from '@/infrastructure/websocket/websocket.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html'
})
export class ChatComponent implements OnInit {
  messages: Message[] = [];
  loading = false;

  constructor(
    private messageService: MessageServiceEnhanced,
    private webSocket: WebSocketService
  ) {}

  ngOnInit() {
    // Charger les messages (avec cache et support offline)
    this.loadMessages();

    // Écouter les nouveaux messages en temps réel
    this.webSocket.onEvent(WebSocketEventType.MESSAGE).subscribe(event => {
      this.messages.push(event.data);
    });
  }

  loadMessages() {
    this.loading = true;
    this.messageService.getConversation('patient-id').subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.loading = false;
      }
    });
  }

  sendMessage(content: string) {
    // Envoie avec support offline
    this.messageService.sendMessage({
      destinataireId: 'patient-id',
      contenu: content
    }).subscribe({
      next: (message) => {
        // Le message est automatiquement ajouté à la liste via WebSocket
        console.log('Message envoyé:', message);
      },
      error: (error) => {
        console.error('Erreur:', error);
        // Le message est sauvegardé localement pour synchronisation ultérieure
      }
    });
  }
}
```

## 🚀 Démarrage

Tous les services sont initialisés automatiquement au démarrage de l'application via `AppInitService` dans `app.config.ts`.

Aucune configuration supplémentaire n'est nécessaire, sauf pour l'URL du WebSocket dans `websocket.config.ts`.

## 📊 Monitoring

Tous les services loggent leurs opérations dans la console avec des emojis pour faciliter le débogage :

- ✅ Succès
- ❌ Erreur
- 🔄 Synchronisation
- 📦 Cache
- 🔌 WebSocket
- 💾 IndexedDB
- 📴 Offline
- 🌐 Online

