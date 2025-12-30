import type { Result } from "../../shared/types/Result";
import type { DossierMedical } from "../entities/DossierMedical";

/**
 * Interface du repository des dossiers médicaux
 */
export interface DossierMedicalRepository {
  /**
   * Récupère tous les dossiers médicaux d'un patient
   */
  getByPatient(patientId: string): Promise<Result<DossierMedical[]>>;

  /**
   * Récupère un dossier médical par son ID
   */
  getById(dossierId: string): Promise<Result<DossierMedical>>;

  /**
   * Téléverse un nouveau dossier médical
   */
  upload(
    dossier: Omit<DossierMedical, "id" | "version" | "dernierModification">,
    fichierUri?: string
  ): Promise<Result<DossierMedical>>;

  /**
   * Met à jour un dossier médical
   */
  update(
    dossierId: string,
    updates: Partial<DossierMedical>
  ): Promise<Result<DossierMedical>>;

  /**
   * Supprime un dossier médical
   */
  delete(dossierId: string): Promise<Result<void>>;
}

