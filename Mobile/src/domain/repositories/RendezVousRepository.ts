import type { Result } from "../../shared/types/Result";
import type { RendezVous } from "../entities/RendezVous";

/**
 * Interface du repository des rendez-vous
 */
export interface RendezVousRepository {
  /**
   * Crée un nouveau rendez-vous
   */
  create(
    rendezVous: Omit<RendezVous, "id" | "statut">
  ): Promise<Result<RendezVous>>;

  /**
   * Récupère un rendez-vous par son ID
   */
  getById(rendezVousId: string): Promise<Result<RendezVous>>;

  /**
   * Récupère les rendez-vous d'un patient
   */
  getByPatient(patientId: string): Promise<Result<RendezVous[]>>;

  /**
   * Récupère les rendez-vous d'un médecin
   */
  getByMedecin(medecinId: string): Promise<Result<RendezVous[]>>;

  /**
   * Annule un rendez-vous
   */
  cancel(rendezVousId: string): Promise<Result<void>>;

  /**
   * Récupère toutes les disponibilités actives publiées par les médecins
   */
  getDisponibilitesPublic(): Promise<Result<any[]>>;
}

