import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API_CONFIG } from '../../infrastructure/config/api.config';
import { DocumentMedical } from '../../domain/models';

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
 * Service pour la gestion des documents médicaux (vue médecin - lecture seule)
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentMedicalService {
  private readonly API_BASE_URL = `${API_CONFIG.BASE_URL}`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les documents d'un dossier médical
   */
  getDocumentsByDossier(dossierId: string): Observable<DocumentMedical[]> {
    const params = new HttpParams().set('dossierId', dossierId);

    return this.http.get<DocumentMedical[]>(`${this.API_BASE_URL}/documents-medicaux`, { params })
      .pipe(
        map(documents => documents || []),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère un document médical par son ID
   */
  getDocumentById(documentId: string): Observable<DocumentMedical> {
    return this.http.get<ApiResponse<DocumentMedical>>(`${this.API_BASE_URL}/documents-medicaux/${documentId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.error || 'Erreur lors de la récupération du document');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Télécharge un document médical (si autorisé)
   */
  downloadDocument(documentId: string): Observable<Blob> {
    return this.http.get(`${this.API_BASE_URL}/documents-medicaux/${documentId}/download`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Vérifie si le médecin a accès à un document
   */
  verifierAccesDocument(documentId: string): Observable<{ hasAccess: boolean; peutTelecharger: boolean; peutScreenshot: boolean }> {
    const params = new HttpParams()
      .set('typeRessource', 'document')
      .set('idRessource', documentId);

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
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  };
}

