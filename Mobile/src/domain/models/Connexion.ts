/**
 * Statut d'une connexion
 */
export type Status = "En_attente" | "Accepté" | "Revoqué";

/**
 * Niveau d'accès
 */
export type NiveauAcces = "Complet" | "Partiel" | "Lecture_Seule";

/**
 * Modèle pour une connexion entre un patient et un médecin
 */
export interface Connexion {
  id: string;
  idPatient: string;
  idMedecin: string;
  statut: Status;
  niveauAcces?: NiveauAcces;
  dateCreation: string;
  dateAcceptation?: string;
}

