import type { TypeEnregistrement } from "../enums";

/**
 * Entité représentant un document médical
 */
export interface DocumentMedical {
  readonly id: string;
  readonly idDossierMedical: string;
  readonly idPatient: string;
  readonly nom: string;
  readonly type: TypeEnregistrement;
  readonly description?: string;
  readonly cheminFichier?: string;
  readonly dateCreation: string; // ISO date string
}

