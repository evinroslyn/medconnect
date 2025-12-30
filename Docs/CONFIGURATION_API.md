# Configuration de l'URL de l'API

## Problème de connexion avec un téléphone physique

Lorsque vous utilisez un téléphone physique (pas un émulateur), l'application doit se connecter à l'IP locale de votre ordinateur sur le réseau, et non à `localhost` ou `10.0.2.2`.

## Solution automatique

L'application détecte automatiquement l'IP locale depuis l'URL Expo. Si vous voyez dans les logs Expo une URL comme `exp://10.201.164.111:8081`, l'application utilisera automatiquement `http://10.201.164.111:3000/api`.

## Solution manuelle (si la détection automatique ne fonctionne pas)

### Option 1 : Variable d'environnement (recommandé)

Créez un fichier `.env` à la racine du dossier `Mobile` avec :

```env
EXPO_PUBLIC_API_URL=http://VOTRE_IP_LOCALE:3000/api
```

Remplacez `VOTRE_IP_LOCALE` par l'IP locale de votre ordinateur. Pour trouver votre IP :

**Windows :**
```cmd
ipconfig
```
Cherchez l'adresse IPv4 de votre carte réseau (généralement sous "Carte réseau sans fil Wi-Fi" ou "Adaptateur Ethernet").

**Mac/Linux :**
```bash
ifconfig
# ou
ip addr
```

### Option 2 : Modifier directement le code

Si la détection automatique ne fonctionne pas, vous pouvez modifier temporairement `Mobile/src/infrastructure/http/httpClient.ts` :

```typescript
const getBaseUrl = () => {
  // Forcer l'IP locale pour les appareils physiques
  if (Platform.OS === "android") {
    const localIP = "10.201.164.111"; // Remplacez par votre IP
    return `http://${localIP}:3000`;
  }
  // ...
};
```

## Vérification

1. Assurez-vous que le backend est démarré sur `http://localhost:3000`
2. Vérifiez que votre téléphone et votre ordinateur sont sur le même réseau Wi-Fi
3. Vérifiez que le port 3000 n'est pas bloqué par le pare-feu Windows
4. Redémarrez l'application Expo après avoir modifié la configuration

## Dépannage

Si vous avez toujours des erreurs de connexion :

1. **Vérifiez l'IP dans les logs Expo** : L'IP affichée dans `exp://IP:8081` est celle à utiliser
2. **Testez la connexion** : Ouvrez un navigateur sur votre téléphone et allez à `http://VOTRE_IP:3000/api/auth/profile` (vous devriez voir une erreur d'authentification, pas une erreur de connexion)
3. **Vérifiez le pare-feu** : Autorisez le port 3000 dans le pare-feu Windows
4. **Vérifiez le backend** : Assurez-vous que le backend écoute sur `0.0.0.0:3000` et non seulement sur `localhost:3000`

## 🔴 Erreur "Network request failed" lors de l'upload

Si vous voyez cette erreur lors de l'upload de photos ou de fichiers :

### 1. Vérifier que le backend est démarré

```bash
cd Backend
npm run dev
```

Vous devriez voir :
```
🚀 Serveur Med-Connect démarré sur 0.0.0.0:3000
```

**Important** : Le serveur doit écouter sur `0.0.0.0:3000` (pas seulement `localhost:3000`) pour être accessible depuis votre téléphone.

### 2. Vérifier le pare-feu Windows

Le pare-feu Windows peut bloquer les connexions entrantes sur le port 3000.

**Solution : Autoriser le port 3000 dans le pare-feu**

1. Ouvrez "Pare-feu Windows Defender" dans le Panneau de configuration
2. Cliquez sur "Paramètres avancés"
3. Cliquez sur "Règles de trafic entrant" → "Nouvelle règle"
4. Sélectionnez "Port" → Suivant
5. Sélectionnez "TCP" et entrez "3000" → Suivant
6. Sélectionnez "Autoriser la connexion" → Suivant
7. Cochez tous les profils → Suivant
8. Donnez un nom (ex: "Node.js Backend") → Terminer

**Alternative rapide (PowerShell en tant qu'administrateur) :**
```powershell
New-NetFirewallRule -DisplayName "Node.js Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### 3. Vérifier que le téléphone et l'ordinateur sont sur le même réseau

- Assurez-vous que votre téléphone et votre ordinateur sont connectés au **même réseau Wi-Fi**
- Évitez les réseaux "invités" ou isolés qui peuvent bloquer la communication entre appareils

### 4. Tester la connexion depuis le téléphone

Ouvrez un navigateur sur votre téléphone et allez à :
```
http://VOTRE_IP:3000/health
```

Remplacez `VOTRE_IP` par l'IP affichée dans les logs Expo (ex: `10.201.164.111`).

Vous devriez voir une réponse JSON. Si vous voyez une erreur de connexion, le problème vient du réseau ou du pare-feu.

### 5. Vérifier les logs du backend

Lorsque vous essayez d'uploader, vérifiez les logs du backend. Si vous ne voyez **aucune requête** dans les logs, cela signifie que la requête n'atteint pas le serveur (problème de réseau/pare-feu).

### 6. Solution temporaire : Utiliser ngrok (pour tests uniquement)

Si le problème persiste, vous pouvez utiliser ngrok pour créer un tunnel :

```bash
# Installer ngrok
# Télécharger depuis https://ngrok.com/

# Créer un tunnel
ngrok http 3000
```

Cela vous donnera une URL publique (ex: `https://abc123.ngrok.io`). Utilisez cette URL dans votre `.env` :

```env
EXPO_PUBLIC_API_URL=https://abc123.ngrok.io/api
```

**⚠️ Attention** : Ne pas utiliser ngrok en production. C'est uniquement pour les tests.

