/**
 * Modèle de base pour un utilisateur
 */
export interface User {
  id: string;
  email: string;
  typeUtilisateur: "patient" | "medecin" | "administrateur";
  dateCreation: string;
  derniereConnexion?: string;
}

/**
 * Modèle pour un médecin
 */
export interface Medecin extends User {
  nom: string;
  specialite: string;
  numeroLicence: string;
  statutVerification: "en_attente" | "valide" | "rejete";
  documentIdentite?: string;
  diplome?: string;
  photoProfil?: string;
  telephone?: string;
  mail?: string;
  adresse?: string;
  dateCreation: string;
  typeUtilisateur: "medecin";
}

/**
 * Modèle pour un patient
 */
export interface Patient extends User {
  nom: string;
  dateNaissance: string;
  genre: "Homme" | "Femme" | "Autre";
  typeUtilisateur: "patient";
}

/**
 * Modèle pour un administrateur
 */
export interface Administrateur extends User {
  nom: string;
  typeUtilisateur: "administrateur";
}

