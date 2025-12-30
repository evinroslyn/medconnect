# Med-Connect Backend API

## 📋 Description

API REST pour la plateforme Med-Connect, développée avec Node.js, Express, TypeScript, Drizzle ORM et Supabase.

## 🏗️ Architecture

Le backend suit une **architecture propre (Clean Architecture)** avec les couches suivantes :

### Couches

1. **Domain** (`src/domain/`) : Couche métier
   - Entités du domaine
   - Énumérations
   - Interfaces métier

2. **Application** (`src/application/`) : Couche application
   - Services métier
   - Use cases
   - Logique métier

3. **Infrastructure** (`src/infrastructure/`) : Couche infrastructure
   - Base de données (Drizzle ORM)
   - Authentification (JWT, 2FA)
   - Clients externes (Supabase)

4. **Presentation** (`src/presentation/`) : Couche présentation
   - Routes API
   - Contrôleurs
   - Middlewares

## 🚀 Installation

```bash
npm install
```

## ⚙️ Configuration

1. Copier le fichier `.env.example` vers `.env`
2. Remplir les variables d'environnement nécessaires

## 📦 Scripts Disponibles

- `npm run dev` - Démarre le serveur en mode développement avec hot-reload
- `npm run build` - Compile le TypeScript en JavaScript
- `npm start` - Démarre le serveur en mode production
- `npm run lint` - Vérifie le code avec ESLint
- `npm run format` - Formate le code avec Prettier
- `npm run db:generate` - Génère les migrations Drizzle
- `npm run db:migrate` - Applique les migrations à la base de données
- `npm run db:studio` - Ouvre Drizzle Studio pour visualiser la base de données

## 🗄️ Base de Données

### Génération des Migrations

```bash
npm run db:generate
```

### Application des Migrations

```bash
npm run db:migrate
```

### Visualisation de la Base de Données

```bash
npm run db:studio
```

## 🔐 Authentification

L'API utilise JWT pour l'authentification. Les tokens sont envoyés dans le header `Authorization` :

```
Authorization: Bearer <token>
```

### Middlewares d'Authentification

- `authenticateToken` : Vérifie la présence et la validité du token JWT
- `requirePatient` : Vérifie que l'utilisateur est un patient
- `requireMedecin` : Vérifie que l'utilisateur est un médecin
- `requireAdmin` : Vérifie que l'utilisateur est un administrateur

## 📚 Structure des Dossiers

```
src/
├── domain/
│   ├── entities/          # Entités du domaine
│   └── enums/             # Énumérations
├── application/
│   └── services/          # Services métier (à implémenter)
├── infrastructure/
│   ├── database/
│   │   ├── schema/        # Schémas Drizzle
│   │   ├── db.ts          # Configuration Drizzle
│   │   └── migrate.ts     # Script de migration
│   ├── auth/
│   │   ├── jwt.ts         # Utilitaires JWT
│   │   ├── middleware.ts  # Middlewares d'authentification
│   │   ├── hash.ts        # Hachage des mots de passe
│   │   └── 2fa.ts         # Authentification 2FA
│   └── supabase/
│       └── client.ts      # Client Supabase
├── presentation/
│   ├── routes/            # Routes API (à implémenter)
│   └── controllers/       # Contrôleurs (à implémenter)
└── index.ts               # Point d'entrée de l'application
```

## 🧪 Tests

Les tests seront implémentés dans une phase ultérieure.

## 📝 Documentation de l'API

La documentation complète de l'API sera générée avec Swagger/OpenAPI dans une phase ultérieure.

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt
- Tokens JWT signés et vérifiés
- Authentification 2FA optionnelle
- CORS configuré
- Validation des entrées avec express-validator

## 📄 Licence

ISC

