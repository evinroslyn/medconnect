import type { Result } from "../../shared/types/Result";
import type { DossierMedical } from "../../domain/entities/DossierMedical";
import type { DossierMedicalRepository } from "../../domain/repositories/DossierMedicalRepository";
import { httpClient } from "../http/httpClient";

/**
 * Implémentation HTTP du repository des dossiers médicaux
 */
export class DossierMedicalRepositoryHttp implements DossierMedicalRepository {
  async getByPatient(patientId: string): Promise<Result<DossierMedical[]>> {
    return httpClient.get<DossierMedical[]>(`/dossiers-medicaux?patientId=${patientId}`);
  }

  async getById(dossierId: string): Promise<Result<DossierMedical>> {
    return httpClient.get<DossierMedical>(`/dossiers-medicaux/${dossierId}`);
  }

  async upload(
    dossier: Omit<DossierMedical, "id" | "version" | "dernierModification">,
    _fichierUri?: string // Fichier non utilisé - les dossiers sont des conteneurs
  ): Promise<Result<DossierMedical>> {
    // Créer un dossier médical (sans fichier - les fichiers vont dans DocumentMedical)
    const dossierData = {
      idPatient: dossier.idPatient,
      titre: dossier.titre?.trim() || "",
      date: dossier.date instanceof Date ? dossier.date.toISOString().split("T")[0] : dossier.date,
      description: dossier.description?.trim() || undefined,
      type: dossier.type, // Optionnel
    };

    console.log("[DossierMedicalRepository] Create dossier - Data to send:", {
      ...dossierData,
      titreLength: dossierData.titre.length,
      dateLength: dossierData.date.length,
      hasTitre: !!dossierData.titre,
      hasDate: !!dossierData.date,
    });

    return httpClient.post<DossierMedical>("/dossiers-medicaux", dossierData);
  }

  async update(
    dossierId: string,
    updates: Partial<DossierMedical>
  ): Promise<Result<DossierMedical>> {
    return httpClient.patch<DossierMedical>(`/dossiers-medicaux/${dossierId}`, updates);
  }

  async delete(dossierId: string): Promise<Result<void>> {
    return httpClient.delete<void>(`/dossiers-medicaux/${dossierId}`);
  }
}

