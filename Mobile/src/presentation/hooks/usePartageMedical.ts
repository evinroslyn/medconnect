import { PartageMedicalService } from "../../application/services/PartageMedicalService";
import { PartageMedicalRepositoryHttp } from "../../infrastructure/repositories/PartageMedicalRepositoryHttp";

const partageRepository = new PartageMedicalRepositoryHttp();
const partageService = new PartageMedicalService(partageRepository);

/**
 * Hook pour utiliser le service de partage médical
 */
export function usePartageMedical(): PartageMedicalService {
  return partageService;
}

