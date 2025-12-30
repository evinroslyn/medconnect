import { TypeEnregistrement } from "./dossier-medical.model";

/**
 * Modèle pour un document médical
 */
export interface DocumentMedical {
  id: string;
  idDossierMedical: string;
  idPatient: string;
  nom: string;
  type: TypeEnregistrement;
  description?: string;
  cheminFichier?: string;
  dateCreation: string;
}

