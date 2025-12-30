import type { Result } from "../../shared/types/Result";
import type { DocumentMedical } from "../../domain/entities/DocumentMedical";
import type { DocumentMedicalRepository } from "../../domain/repositories/DocumentMedicalRepository";

/**
 * Service applicatif de gestion des documents médicaux
 */
export class DocumentMedicalService {
  private readonly documentRepository: DocumentMedicalRepository;

  constructor(documentRepository: DocumentMedicalRepository) {
    this.documentRepository = documentRepository;
  }

  /**
   * Récupère tous les documents médicaux d'un dossier
   */
  async getDocumentsByDossier(dossierId: string): Promise<Result<DocumentMedical[]>> {
    return this.documentRepository.getByDossier(dossierId);
  }

  /**
   * Récupère tous les documents médicaux d'un patient
   */
  async getDocumentsByPatient(patientId: string): Promise<Result<DocumentMedical[]>> {
    return this.documentRepository.getByPatient(patientId);
  }

  /**
   * Récupère un document médical par son ID
   */
  async getDocumentById(documentId: string): Promise<Result<DocumentMedical>> {
    return this.documentRepository.getById(documentId);
  }

  /**
   * Téléverse un nouveau document médical
   */
  async uploadDocument(
    document: Omit<DocumentMedical, "id" | "dateCreation">,
    fichierUri?: string
  ): Promise<Result<DocumentMedical>> {
    return this.documentRepository.upload(document, fichierUri);
  }

  /**
   * Met à jour un document médical
   */
  async updateDocument(
    documentId: string,
    updates: Partial<DocumentMedical>
  ): Promise<Result<DocumentMedical>> {
    return this.documentRepository.update(documentId, updates);
  }

  /**
   * Supprime un document médical
   */
  async deleteDocument(documentId: string): Promise<Result<void>> {
    return this.documentRepository.delete(documentId);
  }
}

