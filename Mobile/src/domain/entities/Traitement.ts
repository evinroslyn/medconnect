/**
 * Entité représentant un traitement médical d'un patient
 */
export class Traitement {
  readonly id: string;
  readonly idPatient: string;
  readonly nom: string;
  readonly description?: string;
  readonly dateDebut: Date;
  readonly dateFin?: Date;
  readonly posologie?: string;
  readonly medecinPrescripteur?: string;
  readonly dateCreation?: Date;

  constructor(
    id: string,
    idPatient: string,
    nom: string,
    dateDebut: Date,
    description?: string,
    dateFin?: Date,
    posologie?: string,
    medecinPrescripteur?: string,
    dateCreation?: Date
  ) {
    this.id = id;
    this.idPatient = idPatient;
    this.nom = nom;
    this.dateDebut = dateDebut;
    this.description = description;
    this.dateFin = dateFin;
    this.posologie = posologie;
    this.medecinPrescripteur = medecinPrescripteur;
    this.dateCreation = dateCreation;
  }
}

