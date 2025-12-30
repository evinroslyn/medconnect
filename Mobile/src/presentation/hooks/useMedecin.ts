import { useMemo } from "react";
import { MedecinService } from "../../application/services/MedecinService";
import { MedecinRepositoryHttp } from "../../infrastructure/repositories/MedecinRepositoryHttp";

/**
 * Hook pour utiliser le service des médecins
 */
export function useMedecin() {
  const medecinService = useMemo(() => {
    const medecinRepository = new MedecinRepositoryHttp();
    return new MedecinService(medecinRepository);
  }, []);

  return medecinService;
}

