import type { Result } from "../../shared/types/Result";
import type { Commentaire } from "../../domain/entities/Commentaire";
import type { CommentaireRepository, CreateCommentaireData } from "../../domain/repositories/CommentaireRepository";
import { httpClient } from "../http/httpClient";

/**
 * Implémentation HTTP du repository des commentaires
 */
export class CommentaireRepositoryHttp implements CommentaireRepository {
  async create(data: CreateCommentaireData): Promise<Result<Commentaire>> {
    return httpClient.post<Commentaire>("/commentaires", data);
  }

  async getByDocument(documentId: string): Promise<Result<Commentaire[]>> {
    const result = await httpClient.get<{ success: boolean; data?: Commentaire[]; error?: string }>(
      `/commentaires/document/${documentId}`
    );
    
    if (result.ok && result.value.success && result.value.data) {
      return { ok: true, value: result.value.data };
    }
    
    return { ok: false, error: result.value?.error || "Impossible de récupérer les commentaires" };
  }

  async getByDossier(dossierId: string): Promise<Result<Commentaire[]>> {
    const result = await httpClient.get<{ success: boolean; data?: Commentaire[]; error?: string }>(
      `/commentaires/dossier/${dossierId}`
    );
    
    if (result.ok && result.value.success && result.value.data) {
      return { ok: true, value: result.value.data };
    }
    
    return { ok: false, error: result.value?.error || "Impossible de récupérer les commentaires" };
  }

  async delete(commentaireId: string): Promise<Result<void>> {
    const result = await httpClient.delete<{ success: boolean; message?: string; error?: string }>(
      `/commentaires/${commentaireId}`
    );
    
    if (result.ok && result.value.success) {
      return { ok: true, value: undefined };
    }
    
    return { ok: false, error: result.value?.error || "Impossible de supprimer le commentaire" };
  }
}

