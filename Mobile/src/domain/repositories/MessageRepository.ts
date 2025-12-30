import type { Result } from "../../shared/types/Result";
import type { Message } from "../entities/Message";

/**
 * Interface du repository des messages
 */
export interface MessageRepository {
  /**
   * Envoie un nouveau message
   */
  send(
    destinataireId: string,
    contenu: string
  ): Promise<Result<Message>>;

  /**
   * Récupère les messages d'une conversation
   */
  getConversation(
    autreUtilisateurId: string
  ): Promise<Result<Message[]>>;

  /**
   * Récupère toutes les conversations de l'utilisateur
   */
  getConversations(): Promise<Result<Array<{
    utilisateurId: string;
    nom: string;
    dernierMessage: Message;
    nonLu: number;
  }>>>;

  /**
   * Marque un message comme lu
   */
  markAsRead(messageId: string): Promise<Result<void>>;
}

