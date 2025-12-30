import type { Result } from "../../shared/types/Result";
import type { Medecin } from "../../domain/entities/Medecin";
import type { MedecinRepository } from "../../domain/repositories/MedecinRepository";

/**
 * Use case pour rechercher des médecins
 */
export class SearchMedecinsUseCase {
  constructor(private readonly medecinRepository: MedecinRepository) {}

  async execute(specialite?: string): Promise<Result<Medecin[]>> {
    return this.medecinRepository.searchBySpecialite(specialite);
  }
}

