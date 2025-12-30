import type { Result } from "../../shared/types/Result";
import type { Message } from "../../domain/entities/Message";
import type { MessageRepository } from "../../domain/repositories/MessageRepository";

/**
 * Use case pour récupérer une conversation
 */
export class GetConversationUseCase {
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute(autreUtilisateurId: string): Promise<Result<Message[]>> {
    return this.messageRepository.getConversation(autreUtilisateurId);
  }
}

