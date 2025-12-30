import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Medecin, Patient, DossierMedical, Connexion } from "@/domain/models";

/**
 * Service de gestion des médecins
 * Gère les opérations liées aux médecins (liste patients, dossiers, etc.)
 */
@Injectable({
  providedIn: "root",
})
export class MedecinService {
  private readonly apiUrl = "/api/medecins";

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste des patients connectés au médecin
   * @returns Observable avec la liste des patients
   */
  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/patients`);
  }

  /**
   * Récupère le profil d'un patient
   * @param patientId - Identifiant du patient
   * @returns Observable avec le profil du patient
   */
  getPatientProfile(patientId: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/patients/${patientId}`);
  }

  /**
   * Récupère les dossiers médicaux d'un patient
   * @param patientId - Identifiant du patient
   * @param filters - Filtres de recherche (optionnel)
   * @returns Observable avec la liste des dossiers
   */
  getPatientDossiers(
    patientId: string,
    filters?: { type?: string; dateDebut?: string; dateFin?: string }
  ): Observable<DossierMedical[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.type) params = params.set("type", filters.type);
      if (filters.dateDebut) params = params.set("dateDebut", filters.dateDebut);
      if (filters.dateFin) params = params.set("dateFin", filters.dateFin);
    }
    return this.http.get<DossierMedical[]>(`${this.apiUrl}/patients/${patientId}/dossiers`, {
      params,
    });
  }

  /**
   * Ajoute un commentaire à un dossier médical
   * @param dossierId - Identifiant du dossier
   * @param contenu - Contenu du commentaire
   * @returns Observable avec le commentaire créé
   */
  addCommentaire(dossierId: string, contenu: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/commentaires`, {
      idDossierMedical: dossierId,
      contenu,
    });
  }
}

