# Med-Connect

## 📋 Description du Projet

Med-Connect est une plateforme innovante à deux faces conçue pour révolutionner la façon dont les patients et les professionnels de santé gèrent et accèdent aux dossiers médicaux. L'objectif principal est de permettre aux patients de maîtriser leur dossier médical tout en offrant aux médecins et aux professionnels de santé une vue sécurisée, à la demande et centralisée du parcours de santé du patient.

### 🎯 Objectifs

- **Pour les patients** : Un dossier médical numérique personnel dans lequel ils peuvent télécharger, gérer et consulter tous leurs documents médicaux
- **Pour les médecins** : Un portail sécurisé permettant d'accéder au dossier médical des patients qui leur ont accordé l'accès
- **Communication** : Une fonction de messagerie sécurisée et de téléconsultation intégrée

## 🏗️ Architecture du Projet

Le projet est organisé en trois composants principaux :

```
meed-connect/
├── Backend/          # API REST avec Node.js/Express, Drizzle ORM, Supabase
├── Mobile/           # Application mobile React Native (côté patient)
└── Web/              # Application web Angular (côté médecin et admin)
```

### Technologies Utilisées

#### Backend
- **Node.js** avec **Express.js** - Framework web
- **TypeScript** - Langage de programmation
- **Drizzle ORM** - ORM pour la gestion de la base de données
- **MySQL** - Base de données relationnelle
- **JWT** - Authentification par tokens
- **bcrypt** - Hachage des mots de passe
- **OTPLib** - Authentification à deux facteurs (2FA)

#### Mobile
- **React Native** avec **Expo** - Framework mobile multiplateforme
- **TypeScript** - Langage de programmation

#### Web
- **Angular** - Framework web
- **TypeScript** - Langage de programmation

## 📁 Structure du Backend

Le backend suit une **architecture propre (Clean Architecture)** avec séparation des responsabilités :

```
Backend/
├── src/
│   ├── domain/              # Couche domaine (entités, enums, interfaces)
│   │   ├── entities/        # Entités métier
│   │   └── enums/           # Énumérations
│   ├── application/         # Couche application (services, use cases)
│   │   └── services/        # Services métier
│   ├── infrastructure/      # Couche infrastructure (base de données, auth, etc.)
│   │   ├── database/        # Configuration Drizzle et schémas
│   │   ├── auth/            # Authentification JWT et 2FA
│   │   └── supabase/        # Client Supabase
│   └── presentation/        # Couche présentation (routes, contrôleurs)
│       ├── routes/          # Routes API
│       └── controllers/     # Contrôleurs
├── drizzle/                 # Migrations de base de données
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Installation et Configuration

### Prérequis

- Node.js (v18 ou supérieur)
- npm ou yarn
- MySQL Server (version 8.0 ou supérieure)

### Configuration du Backend

1. **Installer les dépendances** :
```bash
cd Backend
npm install
```

2. **Configurer les variables d'environnement** :
```bash
cp .env.example .env
```

Modifier le fichier `.env` avec vos propres valeurs :
```env
# Configuration Base de données MySQL
DATABASE_URL=mysql://user:password@localhost:3306/medconnect
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=medconnect

# Configuration Stockage de Fichiers
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Configuration JWT
JWT_SECRET=votre_secret_jwt
JWT_EXPIRES_IN=24h

# Configuration 2FA
TWO_FACTOR_ISSUER=Med-Connect

# Configuration Serveur
PORT=3000
NODE_ENV=development

# Configuration CORS
CORS_ORIGIN=http://localhost:4200,http://localhost:8081
```

3. **Générer les migrations** :
```bash
npm run db:generate
```

4. **Appliquer les migrations** :
```bash
npm run db:migrate
```

5. **Démarrer le serveur en mode développement** :
```bash
npm run dev
```

Le serveur sera accessible sur `http://localhost:3000`

### Configuration du Mobile

1. **Installer les dépendances** :
```bash
cd Mobile
npm install
```

2. **Démarrer l'application** :
```bash
npm start
```

### Configuration du Web

1. **Installer les dépendances** :
```bash
cd Web
npm install
```

2. **Démarrer l'application** :
```bash
npm start
```

L'application sera accessible sur `http://localhost:4200`

## 📚 Documentation de l'API

### Endpoints de Base

- `GET /health` - Vérification de l'état de l'API

### Endpoints d'Authentification (à implémenter)

- `POST /api/auth/register` - Inscription d'un nouvel utilisateur
- `POST /api/auth/login` - Connexion d'un utilisateur
- `POST /api/auth/2fa/enable` - Activer l'authentification 2FA
- `POST /api/auth/2fa/verify` - Vérifier le code 2FA

### Endpoints Patients (à implémenter)

- `GET /api/patients/profile` - Obtenir le profil du patient
- `GET /api/patients/dossiers` - Liste des dossiers médicaux
- `POST /api/patients/dossiers` - Téléverser un dossier médical
- `PUT /api/patients/dossiers/:id` - Modifier un dossier médical
- `GET /api/patients/medecins` - Rechercher des médecins
- `POST /api/patients/connexions` - Envoyer une demande de connexion

### Endpoints Médecins (à implémenter)

- `GET /api/medecins/patients` - Liste des patients connectés
- `GET /api/medecins/patients/:id/dossiers` - Dossiers d'un patient
- `POST /api/medecins/commentaires` - Ajouter un commentaire
- `POST /api/medecins/ordonnances` - Créer une ordonnance
- `POST /api/medecins/rendez-vous` - Planifier un rendez-vous

### Endpoints Administrateurs (à implémenter)

- `GET /api/admin/medecins` - Liste des médecins
- `PUT /api/admin/medecins/:id/verifier` - Vérifier un profil médecin
- `DELETE /api/admin/utilisateurs/:id` - Supprimer un utilisateur

## 🔐 Sécurité

- **Authentification JWT** : Tokens JWT pour l'authentification des utilisateurs
- **2FA** : Authentification à deux facteurs optionnelle
- **Hachage des mots de passe** : Utilisation de bcrypt pour sécuriser les mots de passe
- **Chiffrement des données** : Les données sensibles sont chiffrées
- **CORS** : Configuration CORS pour limiter les origines autorisées

## 📊 Modèle de Données

Le modèle de données est basé sur le diagramme de classes UML fourni. Les principales entités sont :

- **Utilisateur** (classe abstraite)
  - **Patient** : Utilisateurs patients
  - **Medecin** : Professionnels de santé
  - **Administrateur** : Administrateurs du système

- **DossierMedical** : Dossiers médicaux des patients
- **Ordonnance** : Prescriptions médicales
- **DocumentMedical** : Documents médicaux (labos, radios, etc.)
- **Allergie** : Allergies des patients
- **Commentaire** : Commentaires des médecins
- **Connexion** : Connexions entre patients et médecins
- **RendezVous** : Rendez-vous et téléconsultations
- **Message** : Messages sécurisés entre utilisateurs

## 🧪 Tests

Les tests seront implémentés dans une phase ultérieure du projet.

## 📝 Contribution

Ce projet est développé dans le cadre des cours "Architecture Web" et "Ingénierie logiciel appliqué au Mobile".

## 📄 Licence

ISC

## 👥 Auteurs

Équipe de développement Med-Connect

---

**Note** : Ce projet est en cours de développement. Certaines fonctionnalités peuvent ne pas être encore implémentées.

