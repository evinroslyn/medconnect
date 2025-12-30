import type { Result } from "../../shared/types/Result";
import type { PartageMedical } from "../entities/PartageMedical";
import type { MedecinInfo } from "../entities/PartageMedical";

/**
 * Interface du repository des partages médicaux
 */
export interface PartageMedicalRepository {
  /**
   * Récupère tous les médecins validés
   */
  getMedecins(): Promise<Result<MedecinInfo[]>>;

  /**
   * Récupère tous les partages d'un patient
   */
  getPartages(): Promise<Result<PartageMedical[]>>;

  /**
   * Crée un nouveau partage
   */
  createPartage(data: {
    idMedecin: string;
    typeRessource: "dossier" | "document";
    idRessource: string;
    peutTelecharger: boolean;
    peutScreenshot: boolean;
    dateExpiration?: string;
  }): Promise<Result<PartageMedical>>;

  /**
   * Révoque un partage
   */
  revoquerPartage(partageId: string): Promise<Result<void>>;
}

