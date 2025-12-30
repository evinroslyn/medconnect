import type { Result } from "../../shared/types/Result";
import type { PartageMedical, MedecinInfo } from "../../domain/entities/PartageMedical";
import type { PartageMedicalRepository } from "../../domain/repositories/PartageMedicalRepository";
import { httpClient } from "../http/httpClient";

/**
 * Implémentation HTTP du repository des partages médicaux
 */
export class PartageMedicalRepositoryHttp implements PartageMedicalRepository {
  async getMedecins(): Promise<Result<MedecinInfo[]>> {
    const result = await httpClient.get<{ success: boolean; data?: MedecinInfo[] }>(
      "/partages-medicaux/medecins"
    );
    if (result.ok) {
      if (result.value.success) {
        // Retourner un tableau vide si data est undefined ou null, sinon retourner data
        return { ok: true, value: result.value.data || [] };
      }
      // Si success est false, retourner l'erreur du serveur
      const errorMessage = (result.value as any).message || (result.value as any).error || "Aucun médecin trouvé";
      return { ok: false, error: errorMessage };
    }
    return result;
  }

  async getPartages(): Promise<Result<PartageMedical[]>> {
    const result = await httpClient.get<{ success: boolean; data?: PartageMedical[] }>(
      "/partages-medicaux"
    );
    if (result.ok) {
      if (result.value.success && result.value.data) {
        return { ok: true, value: result.value.data };
      }
      return { ok: false, error: "Aucun partage trouvé" };
    }
    return result;
  }

  async createPartage(data: {
    idMedecin: string;
    typeRessource: "dossier" | "document";
    idRessource: string;
    peutTelecharger: boolean;
    peutScreenshot: boolean;
    dateExpiration?: string;
  }): Promise<Result<PartageMedical>> {
    const result = await httpClient.post<{ success: boolean; data?: PartageMedical }>(
      "/partages-medicaux",
      data
    );
    if (result.ok) {
      if (result.value.success && result.value.data) {
        return { ok: true, value: result.value.data };
      }
      return { ok: false, error: "Erreur lors de la création du partage" };
    }
    return result;
  }

  async revoquerPartage(partageId: string): Promise<Result<void>> {
    return httpClient.delete<void>(`/partages-medicaux/${partageId}`);
  }
}

