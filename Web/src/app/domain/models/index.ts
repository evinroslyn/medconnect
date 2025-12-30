// Export user models (Patient from user.model is for base User interface)
// Note: Patient from user.model is renamed to PatientUser to avoid conflict
export type { User, Medecin, Administrateur, Patient as PatientUser } from "./user.model";

// Export patient models (Patient from patient.model is for doctor's view)
export type { Patient, PatientWithConnexion } from "./patient.model";

// Export dossier medical models
export type { TypeEnregistrement, DossierMedical } from "./dossier-medical.model";

// Export document medical models
export type { DocumentMedical } from "./document-medical.model";

// Export connexion models
export type { Status, NiveauAcces, Connexion } from "./connexion.model";

// Export message models
export type { Message, Conversation } from "./message.model";

// Export rendez-vous models
export type { RendezVous, Disponibilite } from "./rendez-vous.model";