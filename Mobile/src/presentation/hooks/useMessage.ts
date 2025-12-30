import { useMemo } from "react";
import { MessageService } from "../../application/services/MessageService";
import { MessageRepositoryHttp } from "../../infrastructure/repositories/MessageRepositoryHttp";

/**
 * Hook pour utiliser le service des messages
 */
export function useMessage() {
  const messageService = useMemo(() => {
    const messageRepository = new MessageRepositoryHttp();
    return new MessageService(messageRepository);
  }, []);

  return messageService;
}

