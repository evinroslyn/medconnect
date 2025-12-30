import { useMemo } from "react";
import { CommentaireService } from "../../application/services/CommentaireService";
import { CommentaireRepositoryHttp } from "../../infrastructure/repositories/CommentaireRepositoryHttp";

/**
 * Hook pour utiliser le service de commentaires
 */
export function useCommentaire() {
  const service = useMemo(() => {
    const repository = new CommentaireRepositoryHttp();
    return new CommentaireService(repository);
  }, []);

  return service;
}

