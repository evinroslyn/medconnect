# Configuration de la Communication Mobile ↔ Web

Ce document explique comment configurer la communication entre l'application mobile et le backend.

## Configuration de l'URL de l'API

### Variables d'environnement

Créez un fichier `.env` à la racine du dossier `Mobile/` avec le contenu suivant :

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
```

### URLs selon l'environnement

#### Android Emulator
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
```
`10.0.2.2` est l'alias spécial d'Android pour accéder à `localhost` de la machine hôte.

#### iOS Simulator
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

#### Device Physique (Android/iOS)
Pour tester sur un appareil physique, vous devez utiliser l'IP locale de votre machine :

1. Trouvez votre IP locale :
   - Windows: `ipconfig` dans CMD
   - Mac/Linux: `ifconfig` ou `ip addr`
   - Exemple: `192.168.1.100`

2. Configurez dans `.env` :
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
```

3. **Important** : Assurez-vous que votre appareil mobile et votre ordinateur sont sur le même réseau Wi-Fi.

## Configuration du Backend

### CORS

Le backend doit autoriser les requêtes depuis le mobile. La configuration CORS dans `Backend/src/index.ts` autorise déjà toutes les origines en développement.

### Fichiers Statiques

Les fichiers uploadés sont servis via `/uploads/` avec les headers CORS appropriés pour permettre l'accès depuis le mobile.

## Prévisualisation des Documents

### Images
Les images sont prévisualisées directement via leur URL :
- URL directe : `http://BASE_URL/uploads/filename.jpg`
- Endpoint de download : `http://BASE_URL/api/documents-medicaux/:id/download`

### PDFs
Les PDFs sont ouverts dans le navigateur intégré via l'endpoint de download.

## Utilisation des Utilitaires

### urlBuilder.ts

Le fichier `Mobile/src/infrastructure/utils/urlBuilder.ts` fournit des fonctions utilitaires pour construire les URLs :

```typescript
import { getFileUrl, getDocumentDownloadUrl, getApiUrl } from '@/infrastructure/utils/urlBuilder';

// URL d'un fichier uploadé
const fileUrl = getFileUrl("document-123.pdf");
// Résultat: http://10.0.2.2:3000/uploads/document-123.pdf

// URL de téléchargement d'un document médical
const downloadUrl = getDocumentDownloadUrl("doc-id-123");
// Résultat: http://10.0.2.2:3000/api/documents-medicaux/doc-id-123/download

// URL d'un endpoint API
const apiUrl = getApiUrl();
// Résultat: http://10.0.2.2:3000/api
```

## Dépannage

### Problème : "Network request failed"
- Vérifiez que le backend est démarré (`cd Backend && npm run dev`)
- Vérifiez que l'URL dans `.env` est correcte
- Pour un device physique, vérifiez que l'IP est correcte et que les deux appareils sont sur le même réseau

### Problème : Les images ne s'affichent pas
- Vérifiez que le backend sert les fichiers avec CORS (déjà configuré)
- Vérifiez les logs du backend pour voir si les requêtes arrivent
- Vérifiez que le token d'authentification est présent et valide

### Problème : "Cannot GET /api/..."
- Vérifiez que le backend est démarré
- Vérifiez que la route existe dans le backend
- Vérifiez les logs du backend pour plus de détails

## Test de la Communication

1. Démarrez le backend :
```bash
cd Backend
npm run dev
```

2. Démarrez l'application mobile :
```bash
cd Mobile
npm start
```

3. Testez la connexion :
   - L'application devrait se connecter automatiquement
   - Vérifiez les logs dans la console pour voir les requêtes HTTP
   - Testez la prévisualisation d'une image pour vérifier que les fichiers sont accessibles

