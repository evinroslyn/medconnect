import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API_CONFIG } from '../../infrastructure/config/api.config';
import { DossierMedical, TypeEnregistrement } from '../../domain/models';

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
 * Interface pour les filtres de recherche
 */
export interface FiltresDossier {
  type?: TypeEnregistrement;
  dateDebut?: string;
  dateFin?: string;
}

/**
 * Service pour la gestion des dossiers médicaux (vue médecin - lecture seule)
 */
@Injectable({
  providedIn: 'root'
})
export class DossierMedicalService {
  private readonly API_BASE_URL = `${API_CONFIG.BASE_URL}`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les dossiers médicaux d'un patient (avec vérification d'accès)
   * Les médecins ne peuvent voir que les dossiers partagés avec eux
   */
  getDossiersByPatient(patientId: string, filtres?: FiltresDossier): Observable<DossierMedical[]> {
    let params = new HttpParams().set('patientId', patientId);
    
    if (filtres) {
      if (filtres.type) {
        params = params.set('type', filtres.type);
      }
      if (filtres.dateDebut) {
        params = params.set('dateDebut', filtres.dateDebut);
      }
      if (filtres.dateFin) {
        params = params.set('dateFin', filtres.dateFin);
      }
    }

    return this.http.get<DossierMedical[]>(`${this.API_BASE_URL}/dossiers-medicaux`, { params })
      .pipe(
        map(dossiers => dossiers || []),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère un dossier médical par son ID (avec vérification d'accès)
   */
  getDossierById(dossierId: string): Observable<DossierMedical> {
    // Le backend retourne directement le DossierMedical (sans wrapper success/data)
    return this.http.get<DossierMedical>(`${this.API_BASE_URL}/dossiers-medicaux/${dossierId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Vérifie si le médecin a accès à un dossier
   */
  verifierAccesDossier(dossierId: string): Observable<{ hasAccess: boolean; peutTelecharger: boolean; peutScreenshot: boolean }> {
    const params = new HttpParams()
      .set('typeRessource', 'dossier')
      .set('idRessource', dossierId);

    return this.http.get<ApiResponse<{ hasAccess: boolean; peutTelecharger: boolean; peutScreenshot: boolean }>>(
      `${this.API_BASE_URL}/partages-medicaux/verifier-acces`,
      { params }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return { hasAccess: false, peutTelecharger: false, peutScreenshot: false };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Gestionnaire d'erreurs
   */
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'Une erreur est survenue';
    
    // Gestion spécifique des erreurs de connexion
    if (error.status === 0 || error.message?.includes('ERR_CONNECTION_REFUSED') || error.message?.includes('Unknown Error')) {
      errorMessage = 'Impossible de se connecter au serveur. Veuillez vérifier que le serveur backend est démarré sur le port 3000.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    }

    console.error('[DossierMedicalService] Erreur:', error);
    return throwError(() => new Error(errorMessage));
  };
}

