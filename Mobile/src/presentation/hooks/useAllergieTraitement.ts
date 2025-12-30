import { useMemo } from "react";
import { AllergieTraitementService } from "../../application/services/AllergieTraitementService";
import { AllergieTraitementRepositoryHttp } from "../../infrastructure/repositories/AllergieTraitementRepositoryHttp";

/**
 * Hook pour utiliser le service des allergies et traitements
 */
export function useAllergieTraitement() {
  const service = useMemo(() => {
    const repository = new AllergieTraitementRepositoryHttp();
    return new AllergieTraitementService(repository);
  }, []);

  return service;
}

