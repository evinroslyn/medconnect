import type { Result } from "../../shared/types/Result";
import type { Commentaire } from "../entities/Commentaire";

export interface CreateCommentaireData {
  idDossierMedical: string;
  idDocumentMedical?: string;
  contenu: string;
}

/**
 * Repository pour la gestion des commentaires
 */
export interface CommentaireRepository {
  /**
   * Crée un commentaire sur un document ou dossier médical
   */
  create(data: CreateCommentaireData): Promise<Result<Commentaire>>;

  /**
   * Récupère les commentaires d'un document médical
   */
  getByDocument(documentId: string): Promise<Result<Commentaire[]>>;

  /**
   * Récupère les commentaires d'un dossier médical
   */
  getByDossier(dossierId: string): Promise<Result<Commentaire[]>>;

  /**
   * Supprime un commentaire
   */
  delete(commentaireId: string): Promise<Result<void>>;
}

