import type { Result } from "../../shared/types/Result";
import type { DossierMedical } from "../../domain/entities/DossierMedical";
import type { DossierMedicalRepository } from "../../domain/repositories/DossierMedicalRepository";
import { GetDossiersByPatientUseCase } from "../usecases/GetDossiersByPatientUseCase";

/**
 * Service applicatif de gestion des dossiers médicaux
 */
export class DossierMedicalService {
  private readonly getDossiersByPatientUseCase: GetDossiersByPatientUseCase;
  private readonly dossierRepository: DossierMedicalRepository;

  constructor(dossierRepository: DossierMedicalRepository) {
    this.dossierRepository = dossierRepository;
    this.getDossiersByPatientUseCase = new GetDossiersByPatientUseCase(dossierRepository);
  }

  /**
   * Récupère tous les dossiers médicaux d'un patient
   */
  async getDossiersByPatient(patientId: string): Promise<Result<DossierMedical[]>> {
    return this.getDossiersByPatientUseCase.execute(patientId);
  }

  /**
   * Récupère un dossier médical par son ID
   */
  async getDossierById(dossierId: string): Promise<Result<DossierMedical>> {
    return this.dossierRepository.getById(dossierId);
  }

  /**
   * Téléverse un nouveau dossier médical
   */
  async uploadDossier(
    dossier: Omit<DossierMedical, "id" | "version" | "dernierModification">,
    fichierUri?: string
  ): Promise<Result<DossierMedical>> {
    return this.dossierRepository.upload(dossier, fichierUri);
  }

  /**
   * Met à jour un dossier médical
   */
  async updateDossier(
    dossierId: string,
    updates: Partial<DossierMedical>
  ): Promise<Result<DossierMedical>> {
    return this.dossierRepository.update(dossierId, updates);
  }

  /**
   * Supprime un dossier médical
   */
  async deleteDossier(dossierId: string): Promise<Result<void>> {
    return this.dossierRepository.delete(dossierId);
  }
}
