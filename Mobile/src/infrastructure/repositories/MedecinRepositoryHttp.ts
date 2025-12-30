import type { Result } from "../../shared/types/Result";
import type { Medecin } from "../../domain/entities/Medecin";
import type { Connexion } from "../../domain/entities/Connexion";
import type { MedecinRepository, SearchMedecinsParams } from "../../domain/repositories/MedecinRepository";
import { httpClient } from "../http/httpClient";

/**
 * Implémentation HTTP du repository des médecins
 */
export class MedecinRepositoryHttp implements MedecinRepository {
  async searchMedecins(params?: SearchMedecinsParams): Promise<Result<Medecin[]>> {
    const queryParams = new URLSearchParams();
    if (params?.nom) queryParams.append("nom", params.nom);
    if (params?.specialite) queryParams.append("specialite", params.specialite);
    if (params?.emplacement) queryParams.append("emplacement", params.emplacement);
    
    const url = queryParams.toString() 
      ? `/medecins?${queryParams.toString()}`
      : "/medecins";
    return httpClient.get<Medecin[]>(url);
  }

  async getById(medecinId: string): Promise<Result<Medecin>> {
    return httpClient.get<Medecin>(`/medecins/${medecinId}`);
  }

  async sendConnexionRequest(medecinId: string): Promise<Result<Connexion>> {
    return httpClient.post<Connexion>("/connexions", { idMedecin: medecinId });
  }

  async rejectConnexionRequest(connexionId: string): Promise<Result<void>> {
    return httpClient.patch<void>(`/connexions/${connexionId}/reject`, {});
  }

  async getConnexions(patientId: string): Promise<Result<Connexion[]>> {
    return httpClient.get<Connexion[]>(`/connexions?patientId=${patientId}`);
  }
}

