import type { Result } from "../../shared/types/Result";
import type { DossierMedical } from "../../domain/entities/DossierMedical";
import type { DossierMedicalRepository } from "../../domain/repositories/DossierMedicalRepository";

/**
 * Use case pour récupérer les dossiers médicaux d'un patient
 */
export class GetDossiersByPatientUseCase {
  constructor(private readonly dossierRepository: DossierMedicalRepository) {}

  async execute(patientId: string): Promise<Result<DossierMedical[]>> {
    return this.dossierRepository.getByPatient(patientId);
  }
}

