# Communication Web ↔ Mobile

Ce document décrit la structure de communication entre l'application Web (Angular) et l'application Mobile (React Native).

## Configuration API

Les deux applications utilisent la même API backend :
- **URL Base**: `http://localhost:3000/api` (développement)
- **Production**: À configurer selon l'environnement de déploiement

## Endpoints Partagés

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/reset-password` - Réinitialisation mot de passe

### Médecins
- `GET /api/medecins/patients` - Liste des patients (médecin)
- `GET /api/medecins/patients/:id` - Profil patient
- `GET /api/medecins/patients/:id/dossiers` - Dossiers médicaux

### Patients (Mobile)
- `GET /api/patients/medecins` - Liste des médecins
- `POST /api/patients/connexions` - Demander connexion
- `GET /api/patients/dossiers` - Dossiers médicaux du patient

### Messages
- `GET /api/messages/conversations` - Liste des conversations
- `GET /api/messages/conversations/:patientId` - Messages d'une conversation
- `POST /api/messages` - Envoyer un message

### Rendez-vous
- `GET /api/rendez-vous/medecin` - Rendez-vous du médecin (Web)
- `GET /api/rendez-vous/patient/:patientId` - Rendez-vous d'un patient (Mobile)
- `POST /api/rendez-vous` - Créer un rendez-vous
- `PATCH /api/rendez-vous/:id/annuler` - Annuler un rendez-vous
- `GET /api/rendez-vous/disponibilites` - Disponibilités du médecin
- `POST /api/rendez-vous/disponibilites` - Créer une disponibilité
- `PATCH /api/rendez-vous/disponibilites/:id` - Mettre à jour une disponibilité
- `DELETE /api/rendez-vous/disponibilites/:id` - Supprimer une disponibilité

## Format des Données

### Disponibilité (Rendez-vous)
```typescript
interface Disponibilite {
  id?: string;
  idMedecin: string;
  jour: string; // Format: "YYYY-MM-DD"
  heureDebut: string; // Format: "HH:mm"
  heureFin: string; // Format: "HH:mm"
  lieu?: string;
  centreMedical?: string;
  typeConsultation: 'Téléconsultation' | 'Présentiel';
  actif: boolean;
}
```

### Rendez-vous
```typescript
interface RendezVous {
  id: string;
  idPatient: string;
  idMedecin: string;
  date: string | Date;
  type: 'Téléconsultation' | 'Présentiel';
  statut: 'Planifié' | 'Terminé' | 'Annulé';
  notes?: string;
  duree?: number; // Durée en minutes
}
```

## Authentification

Les deux applications utilisent le même système d'authentification :
- Token JWT stocké dans `localStorage` (Web) ou `AsyncStorage` (Mobile)
- Header `Authorization: Bearer <token>` pour toutes les requêtes authentifiées
- Intercepteur HTTP pour ajouter automatiquement le token

## Synchronisation des Données

### Scénarios de Synchronisation

1. **Nouveau Rendez-vous créé par le Patient (Mobile)**
   - Le médecin voit le nouveau rendez-vous dans son interface Web
   - Notification en temps réel (à implémenter avec WebSockets)

2. **Disponibilité publiée par le Médecin (Web)**
   - Les patients voient la disponibilité dans l'app Mobile
   - Mise à jour en temps réel de la liste des créneaux disponibles

3. **Message envoyé**
   - Synchronisation bidirectionnelle Web ↔ Mobile
   - Notifications push pour les nouveaux messages

## ✅ Fonctionnalités Implémentées

### 1. WebSockets - Communication en Temps Réel

**Web (Angular)** :
- Service `WebSocketService` pour la communication en temps réel
- Reconnexion automatique en cas de déconnexion
- Heartbeat pour maintenir la connexion active
- Support des événements : MESSAGE, RENDEZ_VOUS, DISPONIBILITE, NOTIFICATION

**Utilisation** :
```typescript
// Se connecter
webSocket.connect();

// Écouter les événements
webSocket.onEvent(WebSocketEventType.MESSAGE).subscribe(event => {
  // Traiter le nouveau message
});

// Envoyer un message
webSocket.send(WebSocketEventType.MESSAGE, data);
```

**Backend requis** :
- Endpoint WebSocket : `ws://localhost:3000`
- Authentification via token JWT dans l'URL : `ws://localhost:3000?token=<jwt_token>`
- Format des messages : `{ type: string, data: any, timestamp: number }`

### 2. Synchronisation Offline

**Web (Angular)** :
- Service `IndexedDBService` pour le stockage local
- Service `SyncService` pour la synchronisation automatique
- Détection automatique du statut réseau (online/offline)
- File d'attente pour les opérations en attente

**Stores IndexedDB** :
- `messages` : Messages de conversation
- `rendezVous` : Rendez-vous
- `disponibilites` : Disponibilités des médecins
- `patients` : Données des patients
- `conversations` : Conversations
- `pendingOperations` : Opérations en attente de synchronisation

**Flux de synchronisation** :
1. Mode offline : Données sauvegardées localement avec `synced: false`
2. Retour en ligne : Synchronisation automatique de toutes les données non synchronisées
3. Opérations en attente : Exécution automatique lors de la reconnexion

### 3. Cache Partagé

**Web (Angular)** :
- Service `CacheService` pour optimiser les appels API
- Intercepteur HTTP automatique pour mettre en cache les réponses GET
- TTL configurable (5 minutes par défaut)
- Invalidation automatique lors des modifications (POST/PUT/DELETE)

**Fonctionnalités** :
- Cache automatique des requêtes GET
- Invalidation intelligente basée sur les patterns d'URL
- Nettoyage automatique des entrées expirées
- Statistiques du cache disponibles

## Prochaines Étapes Mobile

### 1. WebSocket Mobile
Implémenter le client WebSocket côté React Native pour la communication en temps réel.

**Bibliothèque recommandée** : `react-native-websocket` ou `@react-native-async-storage/async-storage` avec `ws`

**Exemple d'implémentation** :
```typescript
import { useEffect, useState } from 'react';
import { WebSocket } from 'react-native';

const useWebSocket = (url: string, token: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`${url}?token=${token}`);
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = (error) => console.error('WebSocket error:', error);
    
    setSocket(ws);
    
    return () => ws.close();
  }, [url, token]);

  return { socket, isConnected };
};
```

### 2. Sync Mobile
Adapter la synchronisation offline pour React Native avec AsyncStorage et SQLite.

**Bibliothèques recommandées** :
- `@react-native-async-storage/async-storage` : Stockage clé-valeur
- `react-native-sqlite-storage` : Base de données SQLite pour données complexes

**Structure de synchronisation** :
- AsyncStorage pour les données simples (token, préférences)
- SQLite pour les données complexes (messages, rendez-vous, dossiers médicaux)
- Service de synchronisation similaire au service Web

### 3. Cache Mobile
Implémenter un système de cache similaire côté mobile.

**Stratégie de cache** :
- Cache mémoire pour les données fréquemment accédées
- AsyncStorage pour le cache persistant
- TTL configurable par type de données
- Nettoyage automatique des entrées expirées

**Bibliothèque recommandée** : `react-query` ou `@tanstack/react-query` pour la gestion du cache et des requêtes

### 4. Notifications Push
Intégrer Firebase Cloud Messaging pour les notifications mobile.

**Configuration requise** :
- Firebase Cloud Messaging (FCM)
- Permissions de notification sur iOS et Android
- Service de notification pour gérer les notifications en arrière-plan

