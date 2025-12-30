import type { Result } from "../../shared/types/Result";
import type { Utilisateur } from "../../domain/entities";
import type { AuthRepository } from "../../domain/repositories/AuthRepository";

/**
 * Use case pour récupérer le profil utilisateur
 */
export class GetProfileUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<Result<Utilisateur>> {
    return this.authRepository.getProfile();
  }
}

