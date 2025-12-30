import type { Result } from "../../shared/types/Result";
import type { Message } from "../../domain/entities/Message";
import type { MessageRepository } from "../../domain/repositories/MessageRepository";
import { SendMessageUseCase, GetConversationUseCase } from "../usecases";

/**
 * Service applicatif de gestion des messages
 */
export class MessageService {
  private readonly sendMessageUseCase: SendMessageUseCase;
  private readonly getConversationUseCase: GetConversationUseCase;
  private readonly messageRepository: MessageRepository;

  constructor(messageRepository: MessageRepository) {
    this.messageRepository = messageRepository;
    this.sendMessageUseCase = new SendMessageUseCase(messageRepository);
    this.getConversationUseCase = new GetConversationUseCase(messageRepository);
  }

  /**
   * Envoie un message
   */
  async send(destinataireId: string, contenu: string): Promise<Result<Message>> {
    return this.sendMessageUseCase.execute(destinataireId, contenu);
  }

  /**
   * Récupère une conversation
   */
  async getConversation(autreUtilisateurId: string): Promise<Result<Message[]>> {
    return this.getConversationUseCase.execute(autreUtilisateurId);
  }

  /**
   * Récupère toutes les conversations
   */
  async getConversations(): Promise<Result<Array<{
    utilisateurId: string;
    nom: string;
    dernierMessage: Message;
    nonLu: number;
  }>>> {
    return this.messageRepository.getConversations();
  }

  /**
   * Marque un message comme lu
   */
  async markAsRead(messageId: string): Promise<Result<void>> {
    return this.messageRepository.markAsRead(messageId);
  }
}

