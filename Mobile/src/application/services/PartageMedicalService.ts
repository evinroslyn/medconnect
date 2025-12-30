import type { Result } from "../../shared/types/Result";
import type { PartageMedical, MedecinInfo } from "../../domain/entities/PartageMedical";
import type { PartageMedicalRepository } from "../../domain/repositories/PartageMedicalRepository";

/**
 * Service applicatif de gestion des partages médicaux
 */
export class PartageMedicalService {
  constructor(private readonly partageRepository: PartageMedicalRepository) {}

  /**
   * Récupère tous les médecins validés
   */
  async getMedecins(): Promise<Result<MedecinInfo[]>> {
    return this.partageRepository.getMedecins();
  }

  /**
   * Récupère tous les partages du patient
   */
  async getPartages(): Promise<Result<PartageMedical[]>> {
    return this.partageRepository.getPartages();
  }

  /**
   * Partage un dossier ou un document avec un médecin
   */
  async partager(
    idMedecin: string,
    typeRessource: "dossier" | "document",
    idRessource: string,
    peutTelecharger: boolean,
    peutScreenshot: boolean,
    dateExpiration?: string
  ): Promise<Result<PartageMedical>> {
    return this.partageRepository.createPartage({
      idMedecin,
      typeRessource,
      idRessource,
      peutTelecharger,
      peutScreenshot,
      dateExpiration,
    });
  }

  /**
   * Révoque un partage
   */
  async revoquer(partageId: string): Promise<Result<void>> {
    return this.partageRepository.revoquerPartage(partageId);
  }
}

