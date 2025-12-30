/**
 * Modèle pour un rendez-vous
 */
export interface RendezVous {
  id: string;
  idPatient: string;
  idMedecin: string;
  date: string | Date;
  type: 'Téléconsultation' | 'Présentiel';
  statut: 'Planifié' | 'Terminé' | 'Annulé';
  notes?: string;
  duree?: number; // Durée en minutes
}

/**
 * Modèle pour une disponibilité du médecin
 */
export interface Disponibilite {
  id?: string;
  idMedecin: string;
  jour: string; // Format: "YYYY-MM-DD"
  heureDebut: string; // Format: "HH:mm"
  heureFin: string; // Format: "HH:mm"
  lieu?: string;
  centreMedical?: string;
  typeConsultation: 'Téléconsultation' | 'Présentiel';
  actif: boolean;
}

