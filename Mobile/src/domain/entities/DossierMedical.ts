import type { TypeEnregistrement } from "../enums";

/**
 * Entité représentant un dossier médical
 */
export interface DossierMedical {
  readonly id: string;
  readonly idPatient: string;
  readonly titre: string;
  readonly date: string; // ISO date string
  readonly description?: string;
  readonly type?: TypeEnregistrement; // Optionnel car un dossier peut contenir différents types
  readonly version: number;
  readonly dernierModification: string; // ISO date string
  // cheminFichier supprimé - les fichiers sont dans DocumentMedical
}

