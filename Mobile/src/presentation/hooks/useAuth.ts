import { useMemo } from "react";
import { AuthService } from "../../application/services/AuthService";
import { AuthRepositoryHttp } from "../../infrastructure/repositories/AuthRepositoryHttp";

/**
 * Hook pour utiliser le service d'authentification
 * Crée une instance unique du service avec ses dépendances
 */
export function useAuth() {
  const authService = useMemo(() => {
    const authRepository = new AuthRepositoryHttp();
    return new AuthService(authRepository);
  }, []);

  return authService;
}

