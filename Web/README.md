# Med-Connect Web (Angular)

## 📋 Description

Application web Angular pour les médecins et administrateurs de Med-Connect. Permet aux médecins d'accéder aux dossiers des patients et aux administrateurs de gérer le système.

## 🏗️ Architecture

L'application suit une **Architecture Propre (Clean Architecture)** avec séparation des responsabilités en couches :

```
src/app/
├── domain/              # Couche domaine (modèles, enums)
│   ├── models/          # Modèles de données
│   └── enums/           # Énumérations
├── application/         # Couche application (services, guards)
│   ├── services/        # Services métier
│   └── guards/          # Guards de routage
├── infrastructure/      # Couche infrastructure (HTTP, config)
│   ├── http/            # Intercepteurs HTTP
│   └── config/          # Configuration
└── presentation/        # Couche présentation (UI)
    └── pages/           # Pages de l'application
```

## 🚀 Installation

```bash
npm install
```

## ⚙️ Configuration

Créer un fichier `environment.ts` dans `src/environments/` avec :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

## 📱 Scripts Disponibles

- `npm start` - Démarre le serveur de développement (port 4200)
- `npm run build` - Compile l'application pour la production
- `npm run test` - Lance les tests unitaires
- `ng lint` - Vérifie le code avec ESLint

## 📦 Dépendances Principales

- **Angular** : Framework web
- **RxJS** : Programmation réactive
- **Angular Forms** : Gestion des formulaires
- **Angular Router** : Navigation et routage

## 🔐 Authentification

L'authentification utilise JWT. Le token est stocké dans localStorage et automatiquement ajouté aux requêtes HTTP via l'intercepteur HTTP Angular.

### Guards

- **AuthGuard** : Protège les routes nécessitant une authentification
- **RoleGuard** : Vérifie le type d'utilisateur (patient, médecin, admin)

## 📚 Structure des Dossiers

### Domain (Domaine)
- **models/** : Interfaces TypeScript pour les données
- **enums/** : Énumérations du domaine

### Application (Application)
- **services/** : Services Angular injectables
  - `AuthService` : Authentification
  - `MedecinService` : Gestion des médecins
  - `AdminService` : Administration
- **guards/** : Guards de routage pour la sécurité

### Infrastructure (Infrastructure)
- **http/** : Intercepteurs HTTP pour ajouter le token JWT
- **config/** : Configuration de l'application

### Presentation (Présentation)
- **pages/** : Composants de pages (pages principales de l'application)

## 🔄 Flux de Données

```
Composant (Presentation)
    ↓
Service (Application)
    ↓
HTTP Client (Infrastructure) → Backend API
    ↓
Observable → Mise à jour de l'UI
```

## 📝 Bonnes Pratiques

1. **Séparation des couches** : Respecter la séparation entre domain, application, infrastructure et presentation
2. **TypeScript** : Utiliser TypeScript strict pour la sécurité de type
3. **RxJS** : Utiliser les observables pour la gestion asynchrone
4. **Composants** : Créer des composants réutilisables
5. **Services** : Logique métier dans les services, pas dans les composants
6. **Code en français** : Commentaires et documentation en français
7. **Guards** : Protéger les routes avec les guards appropriés

## 🧪 Tests

Les tests unitaires sont configurés avec Jasmine et Karma.

## 📄 Licence

ISC
