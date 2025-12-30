import { useMemo } from "react";
import { DossierMedicalService } from "../../application/services/DossierMedicalService";
import { DossierMedicalRepositoryHttp } from "../../infrastructure/repositories/DossierMedicalRepositoryHttp";

/**
 * Hook pour utiliser le service des dossiers médicaux
 */
export function useDossierMedical() {
  const dossierService = useMemo(() => {
    const dossierRepository = new DossierMedicalRepositoryHttp();
    return new DossierMedicalService(dossierRepository);
  }, []);

  return dossierService;
}

