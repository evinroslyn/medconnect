import type { Result } from "../../shared/types/Result";
import type { AuthRepository, LoginData, AuthResponse } from "../../domain/repositories/AuthRepository";

/**
 * Use case pour la connexion d'un utilisateur
 */
export class LoginUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(data: LoginData): Promise<Result<AuthResponse>> {
    return this.authRepository.login(data);
  }
}

