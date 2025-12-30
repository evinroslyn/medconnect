import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API_CONFIG } from '../../infrastructure/config/api.config';

/**
 * Interface pour une allergie
 */
export interface Allergie {
  id: string;
  idPatient: string;
  nom: string;
  description?: string;
  dateDecouverte?: Date;
  idDossierMedical?: string;
}

/**
 * Interface pour un traitement
 */
export interface Traitement {
  id: string;
  idPatient: string;
  nom: string;
  description?: string;
  dateDebut: Date;
  dateFin?: Date;
  posologie?: string;
  medecinPrescripteur?: string;
  dateCreation?: Date;
}

/**
 * Interface pour la réponse de l'API
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Service pour gérer les allergies et traitements des patients
 */
@Injectable({
  providedIn: 'root'
})
export class AllergieTraitementService {
  private readonly API_BASE_URL = `${API_CONFIG.BASE_URL}`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les allergies d'un patient
   */
  getAllergies(patientId: string): Observable<Allergie[]> {
    return this.http.get<ApiResponse<Allergie[]>>(`${this.API_BASE_URL}/patients/${patientId}/allergies`)
      .pipe(
        map(response => response.data || []),
        catchError(this.handleError)
      );
  }

  /**
   * Ajoute une allergie à un patient
   */
  addAllergie(patientId: string, allergie: Partial<Allergie>): Observable<Allergie> {
    return this.http.post<ApiResponse<Allergie>>(`${this.API_BASE_URL}/patients/${patientId}/allergies`, allergie)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Met à jour une allergie
   */
  updateAllergie(allergieId: string, allergie: Partial<Allergie>): Observable<Allergie> {
    return this.http.put<ApiResponse<Allergie>>(`${this.API_BASE_URL}/allergies/${allergieId}`, allergie)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Supprime une allergie
   */
  deleteAllergie(allergieId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API_BASE_URL}/allergies/${allergieId}`)
      .pipe(
        map(() => undefined),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère tous les traitements d'un patient
   */
  getTraitements(patientId: string): Observable<Traitement[]> {
    return this.http.get<ApiResponse<Traitement[]>>(`${this.API_BASE_URL}/patients/${patientId}/traitements`)
      .pipe(
        map(response => response.data || []),
        catchError(this.handleError)
      );
  }

  /**
   * Ajoute un traitement à un patient
   */
  addTraitement(patientId: string, traitement: Partial<Traitement>): Observable<Traitement> {
    return this.http.post<ApiResponse<Traitement>>(`${this.API_BASE_URL}/patients/${patientId}/traitements`, traitement)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Met à jour un traitement
   */
  updateTraitement(traitementId: string, traitement: Partial<Traitement>): Observable<Traitement> {
    return this.http.put<ApiResponse<Traitement>>(`${this.API_BASE_URL}/traitements/${traitementId}`, traitement)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Supprime un traitement
   */
  deleteTraitement(traitementId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API_BASE_URL}/traitements/${traitementId}`)
      .pipe(
        map(() => undefined),
        catchError(this.handleError)
      );
  }

  /**
   * Gestionnaire d'erreurs
   */
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'Une erreur est survenue';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return throwError(() => new Error(errorMessage));
  };
}

