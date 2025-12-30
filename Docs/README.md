# Med-Connect Mobile (React Native)

## 📋 Description

Application mobile React Native (Expo) pour les patients de Med-Connect. Permet aux patients de gérer leurs dossiers médicaux, rechercher des médecins et communiquer avec eux.

## 🏗️ Architecture

L'application suit une **Architecture Propre (Clean Architecture)** avec séparation des responsabilités en couches :

```
src/
├── domain/              # Couche domaine (modèles, enums)
│   ├── models/          # Modèles de données
│   └── enums/           # Énumérations
├── application/         # Couche application (services, use cases)
│   └── services/        # Services métier
├── infrastructure/      # Couche infrastructure (API, storage)
│   ├── api/             # Client API (axios)
│   ├── storage/         # Stockage local (AsyncStorage)
│   └── config/          # Configuration
└── presentation/        # Couche présentation (UI)
    ├── screens/         # Écrans de l'application
    └── components/      # Composants réutilisables
```

## 🚀 Installation

```bash
npm install
```

## ⚙️ Configuration

Créer un fichier `.env` à la racine avec :

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## 📱 Scripts Disponibles

- `npm start` - Démarre Expo en mode développement
- `npm run android` - Lance l'app sur Android
- `npm run ios` - Lance l'app sur iOS
- `npm run web` - Lance l'app sur le web
- `npm run lint` - Vérifie le code avec ESLint

## 📦 Dépendances Principales

- **React Native** : Framework mobile
- **Expo** : Outils et services pour React Native
- **Expo Router** : Navigation basée sur les fichiers
- **Axios** : Client HTTP pour les appels API
- **AsyncStorage** : Stockage local persistant

## 🔐 Authentification

L'authentification utilise JWT. Le token est stocké dans AsyncStorage et automatiquement ajouté aux requêtes HTTP via l'intercepteur axios.

## 📚 Structure des Dossiers

### Domain (Domaine)
- **models/** : Interfaces TypeScript pour les données (User, Patient, DossierMedical, etc.)
- **enums/** : Énumérations du domaine

### Application (Application)
- **services/** : Services métier qui orchestrent les opérations
  - `AuthService` : Authentification
  - `DossierMedicalService` : Gestion des dossiers médicaux
  - `MedecinService` : Recherche et connexion avec les médecins

### Infrastructure (Infrastructure)
- **api/** : Client API avec intercepteurs
- **storage/** : Service de stockage local
- **config/** : Configuration de l'application

### Presentation (Présentation)
- **screens/** : Écrans de l'application
- **components/** : Composants React réutilisables

## 🔄 Flux de Données

```
Écran (Presentation)
    ↓
Service (Application)
    ↓
Client API (Infrastructure) → Backend API
    ↓
Réponse → Stockage Local (si nécessaire)
    ↓
Mise à jour de l'UI
```

## 📝 Bonnes Pratiques

1. **Séparation des couches** : Respecter la séparation entre domain, application, infrastructure et presentation
2. **TypeScript** : Utiliser TypeScript pour la sécurité de type
3. **Gestion d'erreurs** : Gérer les erreurs de manière appropriée
4. **Code en français** : Commentaires et documentation en français
5. **Composants réutilisables** : Créer des composants réutilisables dans `presentation/components`

## 📄 Licence

ISC
