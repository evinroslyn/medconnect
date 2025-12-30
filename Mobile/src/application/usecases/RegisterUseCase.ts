import type { Result } from "../../shared/types/Result";
import type { AuthRepository, RegisterData, AuthResponse } from "../../domain/repositories/AuthRepository";

/**
 * Use case pour l'inscription d'un utilisateur
 */
export class RegisterUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(data: RegisterData): Promise<Result<AuthResponse>> {
    return this.authRepository.register(data);
  }
}

