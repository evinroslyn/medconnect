import { Result } from "../../../domain/common/Result";
import { Allergie } from "../entities/Allergie";
import { Traitement } from "../entities/Traitement";

/**
 * Interface du repository pour les allergies et traitements
 */
export interface AllergieTraitementRepository {
  /**
   * Récupère toutes les allergies d'un patient
   */
  getAllergiesByPatient(idPatient: string): Promise<Result<Allergie[]>>;

  /**
   * Ajoute une allergie à un patient
   */
  addAllergie(
    idPatient: string,
    nom: string,
    description?: string,
    dateDecouverte?: Date
  ): Promise<Result<Allergie>>;

  /**
   * Met à jour une allergie
   */
  updateAllergie(
    id: string,
    nom: string,
    description?: string,
    dateDecouverte?: Date
  ): Promise<Result<Allergie>>;

  /**
   * Supprime une allergie
   */
  deleteAllergie(id: string): Promise<Result<void>>;

  /**
   * Récupère tous les traitements d'un patient
   */
  getTraitementsByPatient(idPatient: string): Promise<Result<Traitement[]>>;

  /**
   * Ajoute un traitement à un patient
   */
  addTraitement(
    idPatient: string,
    nom: string,
    dateDebut: Date,
    description?: string,
    dateFin?: Date,
    posologie?: string,
    medecinPrescripteur?: string
  ): Promise<Result<Traitement>>;

  /**
   * Met à jour un traitement
   */
  updateTraitement(
    id: string,
    nom: string,
    dateDebut: Date,
    description?: string,
    dateFin?: Date,
    posologie?: string,
    medecinPrescripteur?: string
  ): Promise<Result<Traitement>>;

  /**
   * Supprime un traitement
   */
  deleteTraitement(id: string): Promise<Result<void>>;
}

