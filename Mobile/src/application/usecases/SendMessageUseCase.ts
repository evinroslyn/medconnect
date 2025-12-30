import type { Result } from "../../shared/types/Result";
import type { Message } from "../../domain/entities/Message";
import type { MessageRepository } from "../../domain/repositories/MessageRepository";

/**
 * Use case pour envoyer un message
 */
export class SendMessageUseCase {
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute(destinataireId: string, contenu: string): Promise<Result<Message>> {
    return this.messageRepository.send(destinataireId, contenu);
  }
}

