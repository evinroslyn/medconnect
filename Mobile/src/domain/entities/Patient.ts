import type { Utilisateur } from "./Utilisateur";
import type { Genre } from "../enums";

/**
 * Entité représentant un patient
 */
export interface Patient extends Utilisateur {
  readonly typeUtilisateur: "patient";
  readonly nom: string;
  readonly dateNaissance: string; // ISO date string
  readonly genre: Genre;
}

