import type { Utilisateur } from "./Utilisateur";

/**
 * Entité représentant un médecin
 */
export interface Medecin extends Utilisateur {
  readonly typeUtilisateur: "medecin";
  readonly nom: string;
  readonly specialite: string;
  readonly numeroLicence: string;
  readonly anneesExperience?: string;
}

