/**
 * Énumérations du domaine
 */

export enum Status {
  EN_ATTENTE = "En_attente",
  ACCEPTE = "Accepté",
  REVOQUE = "Revoqué",
}

export enum TypeEnregistrement {
  RESULTAT_LABO = "Resultat_Labo",
  RADIO = "Radio",
  ORDONNANCE = "Ordonnance",
  NOTES = "Notes",
  DIAGNOSTIC = "Diagnostic",
  IMAGERIE = "Imagerie",
  EXAMEN = "examen",
}

export enum NiveauAcces {
  COMPLET = "Complet",
  PARTIEL = "Partiel",
  LECTURE_SEULE = "Lecture_Seule",
}

