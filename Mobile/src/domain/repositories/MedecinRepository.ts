import type { Result } from "../../shared/types/Result";
import type { Medecin } from "../entities/Medecin";
import type { Connexion } from "../entities/Connexion";

/**
 * Interface du repository des médecins
 */
export interface SearchMedecinsParams {
  nom?: string;
  specialite?: string;
  emplacement?: string;
}

export interface MedecinRepository {
  /**
   * Recherche des médecins par nom, spécialité ou emplacement
   */
  searchMedecins(params?: SearchMedecinsParams): Promise<Result<Medecin[]>>;

  /**
   * Récupère un médecin par son ID
   */
  getById(medecinId: string): Promise<Result<Medecin>>;

  /**
   * Envoie une demande de connexion à un médecin
   */
  sendConnexionRequest(medecinId: string): Promise<Result<Connexion>>;

  /**
   * Annule une demande de connexion en attente
   */
  rejectConnexionRequest(connexionId: string): Promise<Result<void>>;

  /**
   * Récupère les connexions d'un patient
   */
  getConnexions(patientId: string): Promise<Result<Connexion[]>>;
}

