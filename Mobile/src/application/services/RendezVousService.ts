import type { Result } from "../../shared/types/Result";
import type { RendezVous } from "../../domain/entities/RendezVous";
import type { RendezVousRepository } from "../../domain/repositories/RendezVousRepository";

/**
 * Service applicatif de gestion des rendez-vous
 */
export class RendezVousService {
  constructor(private readonly rendezVousRepository: RendezVousRepository) {}

  /**
   * Crée un nouveau rendez-vous
   */
  async create(
    rendezVous: Omit<RendezVous, "id" | "statut">
  ): Promise<Result<RendezVous>> {
    return this.rendezVousRepository.create(rendezVous);
  }

  /**
   * Récupère un rendez-vous par son ID
   */
  async getById(rendezVousId: string): Promise<Result<RendezVous>> {
    return this.rendezVousRepository.getById(rendezVousId);
  }

  /**
   * Récupère les rendez-vous d'un patient
   */
  async getByPatient(patientId: string): Promise<Result<RendezVous[]>> {
    return this.rendezVousRepository.getByPatient(patientId);
  }

  /**
   * Récupère les rendez-vous d'un médecin
   */
  async getByMedecin(medecinId: string): Promise<Result<RendezVous[]>> {
    return this.rendezVousRepository.getByMedecin(medecinId);
  }

  /**
   * Annule un rendez-vous
   */
  async cancel(rendezVousId: string): Promise<Result<void>> {
    return this.rendezVousRepository.cancel(rendezVousId);
  }

  /**
   * Récupère toutes les disponibilités actives publiées par les médecins
   */
  async getDisponibilitesPublic(): Promise<Result<any[]>> {
    return this.rendezVousRepository.getDisponibilitesPublic();
  }
}

