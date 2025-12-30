/**
 * Entité représentant un partage médical
 */
export interface PartageMedical {
  readonly id: string;
  readonly idPatient: string;
  readonly idMedecin: string;
  readonly typeRessource: "dossier" | "document";
  readonly idRessource: string;
  readonly peutTelecharger: boolean;
  readonly peutScreenshot: boolean;
  readonly dateCreation: string;
  readonly dateExpiration?: string;
  readonly statut: "actif" | "revoke" | "expire";
  readonly medecin?: {
    id: string;
    nom: string;
    specialite: string;
    mail: string;
  };
}

/**
 * Informations d'un médecin pour le partage
 */
export interface MedecinInfo {
  readonly id: string;
  readonly nom: string;
  readonly specialite: string;
  readonly mail: string;
  readonly telephone?: string;
}

