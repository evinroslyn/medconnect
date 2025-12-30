import type { Result } from "../../shared/types/Result";
import type { Medecin } from "../../domain/entities/Medecin";
import type { Connexion } from "../../domain/entities/Connexion";
import type { MedecinRepository } from "../../domain/repositories/MedecinRepository";
import { SearchMedecinsUseCase } from "../usecases/SearchMedecinsUseCase";

/**
 * Service applicatif de gestion des médecins
 */
export class MedecinService {
  private readonly searchMedecinsUseCase: SearchMedecinsUseCase;
  private readonly medecinRepository: MedecinRepository;

  constructor(medecinRepository: MedecinRepository) {
    this.medecinRepository = medecinRepository;
    this.searchMedecinsUseCase = new SearchMedecinsUseCase(medecinRepository);
  }

  /**
   * Recherche des médecins par nom, spécialité ou emplacement
   */
  async searchMedecins(params?: { nom?: string; specialite?: string; emplacement?: string }): Promise<Result<Medecin[]>> {
    return this.medecinRepository.searchMedecins(params);
  }

  /**
   * Récupère un médecin par son ID
   */
  async getMedecinById(medecinId: string): Promise<Result<Medecin>> {
    return this.medecinRepository.getById(medecinId);
  }

  /**
   * Envoie une demande de connexion à un médecin
   */
  async sendConnexionRequest(medecinId: string): Promise<Result<Connexion>> {
    return this.medecinRepository.sendConnexionRequest(medecinId);
  }

  /**
   * Annule une demande de connexion en attente
   */
  async rejectConnexionRequest(connexionId: string): Promise<Result<void>> {
    return this.medecinRepository.rejectConnexionRequest(connexionId);
  }

  /**
   * Récupère les connexions d'un patient
   */
  async getConnexions(patientId: string): Promise<Result<Connexion[]>> {
    return this.medecinRepository.getConnexions(patientId);
  }
}
