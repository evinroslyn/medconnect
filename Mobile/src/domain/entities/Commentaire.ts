/**
 * Entité représentant un commentaire fait par un médecin sur un document médical ou un dossier médical
 */
export interface Commentaire {
  readonly id: string;
  readonly idDossierMedical: string;
  readonly idDocumentMedical?: string;
  readonly idMedecin: string;
  readonly contenu: string;
  readonly dateCreation: string; // ISO date string
  readonly medecinNom?: string;
  readonly medecinSpecialite?: string;
  readonly documentNom?: string;
}

