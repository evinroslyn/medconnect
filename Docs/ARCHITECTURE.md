# Architecture Propre - MEED-CONNECT Mobile

Ce document décrit l'architecture propre (Clean Architecture) mise en place pour l'application mobile MEED-CONNECT.

## Structure du Projet

```
Mobile/
├── app/                          # Expo Router - Points d'entrée des écrans
├── src/
│   ├── domain/                   # Couche Domaine (Business Logic)
│   │   ├── entities/            # Entités métier (interfaces)
│   │   ├── enums/               # Énumérations
│   │   └── repositories/        # Interfaces des repositories (contrats)
│   │
│   ├── application/              # Couche Application
│   │   ├── services/            # Services applicatifs (orchestration)
│   │   └── usecases/            # Cas d'usage (use cases)
│   │
│   ├── infrastructure/           # Couche Infrastructure
│   │   ├── http/                # Client HTTP
│   │   ├── repositories/        # Implémentations des repositories
│   │   ├── storage/             # Service de stockage local
│   │   └── config/              # Configuration
│   │
│   ├── presentation/             # Couche Présentation
│   │   ├── screens/              # Écrans React Native
│   │   ├── components/           # Composants réutilisables
│   │   └── hooks/                # Hooks React personnalisés
│   │
│   └── shared/                   # Code partagé
│       └── types/               # Types utilitaires (Result, etc.)
```

## Principes de l'Architecture Propre

### 1. Séparation des Couches

- **Domain** : Contient uniquement la logique métier pure, sans dépendances externes
- **Application** : Orchestre les use cases et coordonne les repositories
- **Infrastructure** : Implémente les détails techniques (HTTP, stockage, etc.)
- **Presentation** : Interface utilisateur (React Native)

### 2. Règle de Dépendance

Les dépendances pointent toujours vers l'intérieur :
- `presentation` → `application` → `domain`
- `infrastructure` → `domain` (pour implémenter les interfaces)
- `application` → `domain` (pour utiliser les entités et repositories)

**Le domaine ne dépend JAMAIS de l'infrastructure ou de la présentation.**

### 3. Gestion d'Erreurs avec Result

Au lieu d'utiliser des exceptions, nous utilisons le type `Result<T, E>` :

```typescript
type Result<T, E = string> = 
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Cela rend les erreurs explicites et facilite la gestion dans les composants React.

### 4. Repositories Pattern

Les repositories définissent des **interfaces** dans le domaine et sont **implémentés** dans l'infrastructure :

```typescript
// Domain (interface)
interface AuthRepository {
  login(data: LoginData): Promise<Result<AuthResponse>>;
}

// Infrastructure (implémentation)
class AuthRepositoryHttp implements AuthRepository {
  async login(data: LoginData): Promise<Result<AuthResponse>> {
    // Implémentation HTTP
  }
}
```

### 5. Use Cases

Chaque cas d'usage encapsule une action métier spécifique :

```typescript
class LoginUseCase {
  constructor(private readonly authRepository: AuthRepository) {}
  
  async execute(data: LoginData): Promise<Result<AuthResponse>> {
    return this.authRepository.login(data);
  }
}
```

### 6. Services Applicatifs

Les services orchestrent plusieurs use cases et fournissent une interface simplifiée :

```typescript
class AuthService {
  private readonly loginUseCase: LoginUseCase;
  
  async login(data: LoginData): Promise<Result<AuthResponse>> {
    return this.loginUseCase.execute(data);
  }
}
```

## Utilisation dans les Composants React

Les hooks React facilitent l'utilisation des services :

```typescript
import { useAuth } from '@/presentation/hooks/useAuth';

function LoginScreen() {
  const authService = useAuth();
  
  const handleLogin = async () => {
    const result = await authService.login({ telephone, motDePasse });
    
    if (result.ok) {
      // Succès
      router.replace('/(app)');
    } else {
      // Erreur
      Alert.alert('Erreur', result.error);
    }
  };
}
```

## Avantages de cette Architecture

1. **Testabilité** : Chaque couche peut être testée indépendamment
2. **Maintenabilité** : Code organisé et séparation claire des responsabilités
3. **Flexibilité** : Facile de changer l'implémentation (ex: passer de HTTP à GraphQL)
4. **Indépendance** : Le domaine ne dépend d'aucun framework
5. **Évolutivité** : Facile d'ajouter de nouvelles fonctionnalités

## Fichiers Clés

- **Entités** : `src/domain/entities/`
- **Repositories (interfaces)** : `src/domain/repositories/`
- **Use Cases** : `src/application/usecases/`
- **Services** : `src/application/services/`
- **Repositories (implémentations)** : `src/infrastructure/repositories/`
- **Hooks** : `src/presentation/hooks/`

