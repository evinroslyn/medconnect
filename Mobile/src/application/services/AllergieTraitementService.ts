import { AllergieTraitementRepository } from "../../domain/repositories/AllergieTraitementRepository";
import { Allergie } from "../../domain/entities/Allergie";
import { Traitement } from "../../domain/entities/Traitement";
import { Result } from "../../domain/common/Result";

/**
 * Service pour gérer les allergies et traitements des patients
 */
export class AllergieTraitementService {
  constructor(private repository: AllergieTraitementRepository) {}

  /**
   * Récupère toutes les allergies d'un patient
   */
  async getAllergiesByPatient(idPatient: string): Promise<Result<Allergie[]>> {
    return this.repository.getAllergiesByPatient(idPatient);
  }

  /**
   * Ajoute une allergie à un patient
   */
  async addAllergie(
    idPatient: string,
    nom: string,
    description?: string,
    dateDecouverte?: Date
  ): Promise<Result<Allergie>> {
    return this.repository.addAllergie(idPatient, nom, description, dateDecouverte);
  }

  /**
   * Met à jour une allergie
   */
  async updateAllergie(
    id: string,
    nom: string,
    description?: string,
    dateDecouverte?: Date
  ): Promise<Result<Allergie>> {
    return this.repository.updateAllergie(id, nom, description, dateDecouverte);
  }

  /**
   * Supprime une allergie
   */
  async deleteAllergie(id: string): Promise<Result<void>> {
    return this.repository.deleteAllergie(id);
  }

  /**
   * Récupère tous les traitements d'un patient
   */
  async getTraitementsByPatient(idPatient: string): Promise<Result<Traitement[]>> {
    return this.repository.getTraitementsByPatient(idPatient);
  }

  /**
   * Ajoute un traitement à un patient
   */
  async addTraitement(
    idPatient: string,
    nom: string,
    dateDebut: Date,
    description?: string,
    dateFin?: Date,
    posologie?: string,
    medecinPrescripteur?: string
  ): Promise<Result<Traitement>> {
    return this.repository.addTraitement(
      idPatient,
      nom,
      dateDebut,
      description,
      dateFin,
      posologie,
      medecinPrescripteur
    );
  }

  /**
   * Met à jour un traitement
   */
  async updateTraitement(
    id: string,
    nom: string,
    dateDebut: Date,
    description?: string,
    dateFin?: Date,
    posologie?: string,
    medecinPrescripteur?: string
  ): Promise<Result<Traitement>> {
    return this.repository.updateTraitement(
      id,
      nom,
      dateDebut,
      description,
      dateFin,
      posologie,
      medecinPrescripteur
    );
  }

  /**
   * Supprime un traitement
   */
  async deleteTraitement(id: string): Promise<Result<void>> {
    return this.repository.deleteTraitement(id);
  }
}

