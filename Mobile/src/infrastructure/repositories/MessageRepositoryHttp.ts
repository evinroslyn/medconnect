import type { Result } from "../../shared/types/Result";
import { err, ok } from "../../shared/types/Result";
import type { Message } from "../../domain/entities/Message";
import type { MessageRepository } from "../../domain/repositories/MessageRepository";
import { httpClient } from "../http/httpClient";

/**
 * Implémentation HTTP du repository des messages
 */
export class MessageRepositoryHttp implements MessageRepository {
  async send(
    destinataireId: string,
    contenu: string
  ): Promise<Result<Message>> {
    return httpClient.post<Message>("/messages", {
      destinataireId,
      contenu,
    });
  }

  async getConversation(
    autreUtilisateurId: string
  ): Promise<Result<Message[]>> {
    return httpClient.get<Message[]>(`/messages/conversation/${autreUtilisateurId}`);
  }

  async getConversations(): Promise<Result<Array<{
    utilisateurId: string;
    nom: string;
    dernierMessage: Message;
    nonLu: number;
  }>>> {
    try {
      const result = await httpClient.get<Array<{
        utilisateurId: string;
        nom: string;
        dernierMessage: Message;
        nonLu: number;
      }>>("/messages/conversations");

      if (!result.ok) {
        console.error("[MessageRepositoryHttp] getConversations error:", result.error);
        return err(result.error);
      }

      // Le backend retourne directement un tableau ou un objet avec success
      const data = result.value;
      if (Array.isArray(data)) {
        return ok(data);
      }

      // Si c'est un objet avec success, vérifier
      if (data && typeof data === "object" && "success" in data) {
        const response = data as any;
        if (!response.success) {
          return err(response.message || response.error || "Erreur lors du chargement des conversations");
        }
        // Si success est true mais qu'il y a un tableau dans data
        if (Array.isArray(response.data)) {
          return ok(response.data);
        }
      }

      // Par défaut, retourner un tableau vide si la structure n'est pas reconnue
      console.warn("[MessageRepositoryHttp] getConversations - Unexpected response format:", data);
      return ok([]);
    } catch (error: any) {
      console.error("[MessageRepositoryHttp] getConversations exception:", error);
      return err(error.message || "Erreur lors du chargement des conversations");
    }
  }

  async markAsRead(messageId: string): Promise<Result<void>> {
    return httpClient.patch<void>(`/messages/${messageId}/read`, {});
  }
}

