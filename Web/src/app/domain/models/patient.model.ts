/**
 * Modèle pour un patient (vue médecin)
 */
export interface Patient {
  id: string;
  nom: string;
  mail: string;
  telephone: string;
  dateNaissance: string;
  genre: "Homme" | "Femme" | "Autre";
  adresse?: string;
  dateCreation: string;
  derniereConnexion?: string;
}

/**
 * Informations d'un patient avec sa connexion (format backend)
 */
export interface PatientWithConnexion {
  connexionId: string;
  idPatient: string;
  idMedecin: string;
  statutConnexion: "En_attente" | "Accepté" | "Revoqué";
  niveauAcces?: "Complet" | "Partiel" | "Lecture_Seule";
  dateConnexion: string;
  dateAcceptation?: string;
  patientNom: string;
  patientTelephone?: string;
  patientMail?: string;
  patientDateNaissance?: string;
  patientGenre?: "Homme" | "Femme" | "Autre";
  patientAdresse?: string;
}

