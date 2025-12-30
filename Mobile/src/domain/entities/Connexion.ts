import type { Status, NiveauAcces } from "../enums";

/**
 * Entité représentant une connexion entre un patient et un médecin
 */
export interface Connexion {
  readonly id: string;
  readonly idPatient: string;
  readonly idMedecin: string;
  readonly statut: Status;
  readonly niveauAcces?: NiveauAcces;
  readonly dateCreation: string; // ISO date string
  readonly dateAcceptation?: string; // ISO date string
}

