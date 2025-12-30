import type { Result } from "../../shared/types/Result";
import type { RendezVous } from "../../domain/entities/RendezVous";
import type { RendezVousRepository } from "../../domain/repositories/RendezVousRepository";
import { httpClient } from "../http/httpClient";

/**
 * Implémentation HTTP du repository des rendez-vous
 */
export class RendezVousRepositoryHttp implements RendezVousRepository {
  async create(
    rendezVous: Omit<RendezVous, "id" | "statut">
  ): Promise<Result<RendezVous>> {
    // Adapter le modèle mobile au contrat de l'API backend
    const payload = {
      idPatient: rendezVous.patientId,
      idMedecin: rendezVous.medecinId,
      date: rendezVous.date,
      type: "Présentiel" as const,
      notes: rendezVous.motif,
      duree: undefined as number | undefined,
    };

    return httpClient.post<RendezVous>("/rendez-vous", payload as any);
  }

  async getById(rendezVousId: string): Promise<Result<RendezVous>> {
    return httpClient.get<RendezVous>(`/rendez-vous/${rendezVousId}`);
  }

  async getByPatient(patientId: string): Promise<Result<RendezVous[]>> {
    return httpClient.get<RendezVous[]>(`/rendez-vous?patientId=${patientId}`);
  }

  async getByMedecin(medecinId: string): Promise<Result<RendezVous[]>> {
    return httpClient.get<RendezVous[]>(`/rendez-vous?medecinId=${medecinId}`);
  }

  async cancel(rendezVousId: string): Promise<Result<void>> {
    return httpClient.delete<void>(`/rendez-vous/${rendezVousId}`);
  }

  async getDisponibilitesPublic(): Promise<Result<any[]>> {
    const result = await httpClient.get<{ success: boolean; data?: any[]; error?: string }>("/rendez-vous/disponibilites/public");
    if (result.ok && result.value.success && result.value.data) {
      return { ok: true, value: result.value.data };
    }
    return { ok: false, error: result.value?.error || "Impossible de récupérer les disponibilités" };
  }
}

