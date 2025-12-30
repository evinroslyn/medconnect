/**
 * Entité représentant une allergie d'un patient
 */
export class Allergie {
  readonly id: string;
  readonly nom: string;
  readonly idDossierMedical?: string;
  readonly idPatient?: string;
  readonly description?: string;
  readonly dateDecouverte?: Date;

  constructor(
    id: string,
    nom: string,
    idDossierMedical?: string,
    idPatient?: string,
    description?: string,
    dateDecouverte?: Date
  ) {
    this.id = id;
    this.nom = nom;
    this.idDossierMedical = idDossierMedical;
    this.idPatient = idPatient;
    this.description = description;
    this.dateDecouverte = dateDecouverte;
  }
}

