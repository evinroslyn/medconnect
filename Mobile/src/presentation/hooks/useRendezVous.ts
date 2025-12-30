import { useMemo } from "react";
import { RendezVousService } from "../../application/services/RendezVousService";
import { RendezVousRepositoryHttp } from "../../infrastructure/repositories/RendezVousRepositoryHttp";

/**
 * Hook pour utiliser le service des rendez-vous
 */
export function useRendezVous() {
  const rendezVousService = useMemo(() => {
    const rendezVousRepository = new RendezVousRepositoryHttp();
    return new RendezVousService(rendezVousRepository);
  }, []);

  return rendezVousService;
}

