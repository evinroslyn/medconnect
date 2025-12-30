import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API_CONFIG } from '../../infrastructure/config/api.config';
import { Patient, PatientWithConnexion } from '../../domain/models';

/**
 * Interface pour la réponse de l'API
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Service pour la gestion des patients (vue médecin)
 */
@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private readonly API_BASE_URL = `${API_CONFIG.BASE_URL}`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste des patients qui ont accordé l'accès au médecin
   * Utilise les connexions acceptées
   */
  getPatientsWithAccess(): Observable<PatientWithConnexion[]> {
    return this.http.get<PatientWithConnexion[]>(`${this.API_BASE_URL}/connexions/medecin`)
      .pipe(
        map(patients => patients || []),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les demandes de connexion en attente pour le médecin
   */
  getPendingRequests(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_BASE_URL}/connexions/pending`)
      .pipe(
        map(response => {
          // Si la réponse est directement un tableau
          if (Array.isArray(response)) {
            return response;
          }
          // Sinon, extraire le tableau de response.data
          return response.data || [];
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère le profil complet d'un patient
   */
  getPatientProfile(patientId: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.API_BASE_URL}/patients/${patientId}`)
      .pipe(
        map(patient => patient),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère tous les patients (pour l'admin)
   */
  getAllPatients(): Observable<Patient[]> {
    return this.http.get<ApiResponse<Patient[]>>(`${this.API_BASE_URL}/admin/patients`)
      .pipe(
        map(response => response.data || []),
        catchError(this.handleError)
      );
  }

  /**
   * Accepte une demande de connexion
   */
  acceptConnexionRequest(connexionId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.API_BASE_URL}/connexions/${connexionId}/accept`, {})
      .pipe(
        map(response => {
          // Si la réponse a success: true, retourner la réponse
          if (response.success) {
            return response;
          }
          // Sinon, extraire data si présent
          return response.data || response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Rejette une demande de connexion
   */
  rejectConnexionRequest(connexionId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.API_BASE_URL}/connexions/${connexionId}/reject`, {})
      .pipe(
        map(response => {
          // Si la réponse a success: true, retourner la réponse
          if (response.success) {
            return response;
          }
          // Sinon, extraire data si présent
          return response.data || response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Supprime un patient
   */
  deletePatient(patientId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/admin/patients/${patientId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Gestionnaire d'erreurs
   */
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'Une erreur est survenue';

    // Priorité 1: message détaillé depuis error.error
    if (error.error?.message) {
      errorMessage = error.error.message;
    } 
    // Priorité 2: champ error depuis error.error
    else if (error.error?.error) {
      errorMessage = error.error.error;
    }
    // Priorité 3: message d'erreur standard
    else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Erreur PatientService:', error);
    return throwError(() => new Error(errorMessage));
  };
}

