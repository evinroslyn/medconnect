# Infrastructure - Services Avancés

Ce dossier contient les services d'infrastructure avancés pour l'application MedConnect Web.

## 📁 Structure

```
infrastructure/
├── cache/              # Service de cache
├── config/             # Configuration
├── core/               # Services d'initialisation
├── http/               # Intercepteurs HTTP
├── storage/            # Stockage local (IndexedDB)
├── sync/               # Synchronisation offline/online
└── websocket/          # Communication WebSocket
```

## 🔧 Services Disponibles

### 1. WebSocketService

Service pour la communication en temps réel via WebSocket.

**Utilisation :**

```typescript
import { WebSocketService, WebSocketEventType } from '@/infrastructure/websocket/websocket.service';

constructor(private webSocket: WebSocketService) {}

// Se connecter
this.webSocket.connect();

// Écouter les événements
this.webSocket.onEvent(WebSocketEventType.MESSAGE).subscribe(event => {
  console.log('Nouveau message:', event.data);
});

// Envoyer un message
this.webSocket.send(WebSocketEventType.MESSAGE, { contenu: 'Hello' });

// Vérifier le statut de connexion
this.webSocket.connectionStatus$.subscribe(isConnected => {
  console.log('WebSocket connecté:', isConnected);
});
```

### 2. CacheService

Service de cache pour optimiser les appels API.

**Utilisation :**

```typescript
import { CacheService } from '@/infrastructure/cache/cache.service';

constructor(private cache: CacheService) {}

// Mettre en cache
this.cache.set('key', data, 60000); // 60 secondes

// Récupérer du cache
const data = this.cache.get('key');

// Utiliser avec Observable
this.cache.cacheObservable('key', this.http.get('/api/data')).subscribe(...);

// Invalider le cache
this.cache.invalidate('pattern');
```

### 3. IndexedDBService

Service pour le stockage local avec IndexedDB (support offline).

**Utilisation :**

```typescript
import { IndexedDBService } from '@/infrastructure/storage/indexeddb.service';

constructor(private indexedDB: IndexedDBService) {}

// Initialiser (fait automatiquement au démarrage)
this.indexedDB.init().subscribe();

// Ajouter un élément
this.indexedDB.add('messages', message).subscribe();

// Récupérer un élément
this.indexedDB.get('messages', messageId).subscribe();

// Récupérer tous les éléments non synchronisés
this.indexedDB.getUnsynced('messages').subscribe();
```

### 4. SyncService

Service de synchronisation pour gérer les données offline/online.

**Utilisation :**

```typescript
import { SyncService } from '@/infrastructure/sync/sync.service';

constructor(private sync: SyncService) {}

// Vérifier le statut réseau
const isOnline = this.sync.isOnlineMode();

// Synchroniser toutes les données
this.sync.syncAll().subscribe();

// Forcer une synchronisation
this.sync.forceSync().subscribe();

// Obtenir le statut
const status = this.sync.getSyncStatus();
```

## 🚀 Initialisation

Les services sont initialisés automatiquement au démarrage de l'application via `AppInitService`.

## 📝 Exemples d'Intégration

### Intégration dans un composant

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService, WebSocketEventType } from '@/infrastructure/websocket/websocket.service';
import { CacheService } from '@/infrastructure/cache/cache.service';
import { Subscription } from 'rxjs';

@Component({...})
export class MyComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();

  constructor(
    private webSocket: WebSocketService,
    private cache: CacheService
  ) {}

  ngOnInit() {
    // Écouter les nouveaux messages en temps réel
    const sub = this.webSocket.onEvent(WebSocketEventType.MESSAGE)
      .subscribe(event => {
        console.log('Nouveau message reçu:', event.data);
        // Mettre à jour l'UI
      });
    this.subscriptions.add(sub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
```

## 🔄 Flux de Synchronisation

1. **Mode Online** :
   - Les données sont récupérées depuis l'API
   - Mises en cache automatiquement
   - Sauvegardées dans IndexedDB
   - Notifications en temps réel via WebSocket

2. **Mode Offline** :
   - Les données sont récupérées depuis IndexedDB
   - Les modifications sont sauvegardées localement
   - Les opérations sont mises en file d'attente
   - Synchronisation automatique lors du retour en ligne

## ⚙️ Configuration

### WebSocket

Modifier `websocket.config.ts` pour changer l'URL du serveur WebSocket.

### Cache

Le TTL par défaut est de 5 minutes. Modifiable dans `CacheService`.

### IndexedDB

Le nom de la base de données et la version sont configurables dans `IndexedDBService`.

## 🐛 Débogage

Tous les services loggent leurs opérations dans la console avec des emojis :
- ✅ Succès
- ❌ Erreur
- 🔄 Synchronisation
- 📦 Cache
- 🔌 WebSocket
- 💾 IndexedDB

