/**
 * Type d'enregistrement médical
 */
export type TypeEnregistrement =
  | "Resultat_Labo"
  | "Radio"
  | "Ordonnance"
  | "Notes"
  | "Diagnostic"
  | "Imagerie"
  | "examen";

/**
 * Modèle pour un dossier médical
 */
export interface DossierMedical {
  id: string;
  idPatient: string;
  titre: string;
  date: string;
  description?: string;
  type: TypeEnregistrement;
  cheminFichier?: string;
  version: number;
  dernierModification: string;
}

