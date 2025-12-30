import type { CommentaireRepository, CreateCommentaireData } from "../../domain/repositories/CommentaireRepository";
import type { Commentaire } from "../../domain/entities/Commentaire";
import type { Result } from "../../shared/types/Result";

/**
 * Service de gestion des commentaires
 */
export class CommentaireService {
  constructor(private repository: CommentaireRepository) {}

  /**
   * Crée un commentaire
   */
  async create(data: CreateCommentaireData): Promise<Result<Commentaire>> {
    return this.repository.create(data);
  }

  /**
   * Récupère les commentaires d'un document médical
   */
  async getByDocument(documentId: string): Promise<Result<Commentaire[]>> {
    return this.repository.getByDocument(documentId);
  }

  /**
   * Récupère les commentaires d'un dossier médical
   */
  async getByDossier(dossierId: string): Promise<Result<Commentaire[]>> {
    return this.repository.getByDossier(dossierId);
  }

  /**
   * Supprime un commentaire
   */
  async delete(commentaireId: string): Promise<Result<void>> {
    return this.repository.delete(commentaireId);
  }
}

