import type { Result } from "../../shared/types/Result";
import type { DocumentMedical } from "../entities/DocumentMedical";

/**
 * Interface du repository des documents médicaux
 */
export interface DocumentMedicalRepository {
  /**
   * Récupère tous les documents médicaux d'un dossier
   */
  getByDossier(dossierId: string): Promise<Result<DocumentMedical[]>>;

  /**
   * Récupère tous les documents médicaux d'un patient
   */
  getByPatient(patientId: string): Promise<Result<DocumentMedical[]>>;

  /**
   * Récupère un document médical par son ID
   */
  getById(documentId: string): Promise<Result<DocumentMedical>>;

  /**
   * Téléverse un nouveau document médical
   */
  upload(
    document: Omit<DocumentMedical, "id" | "dateCreation">,
    fichierUri?: string
  ): Promise<Result<DocumentMedical>>;

  /**
   * Met à jour un document médical
   */
  update(
    documentId: string,
    updates: Partial<DocumentMedical>
  ): Promise<Result<DocumentMedical>>;

  /**
   * Supprime un document médical
   */
  delete(documentId: string): Promise<Result<void>>;
}

