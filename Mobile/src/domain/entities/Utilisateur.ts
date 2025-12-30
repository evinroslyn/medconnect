/**
 * Entité de base représentant un utilisateur du système
 */
export interface Utilisateur {
  readonly id: string;
  readonly mail: string;
  readonly telephone?: string;
  readonly adresse?: string;
  readonly dateCreation: string; // ISO date string
  readonly derniereConnexion?: string; // ISO date string
  readonly typeUtilisateur: "patient" | "medecin" | "administrateur";
}

