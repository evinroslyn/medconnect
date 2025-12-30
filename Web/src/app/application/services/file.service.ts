import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { API_CONFIG } from '@/infrastructure/config/api.config';

/**
 * Interface pour la réponse d'upload de fichier
 */
interface FileUploadResponse {
  success: boolean;
  message: string;
  data?: {
    filename: string;
    originalName: string;
    size: number;
    url: string;
    path: string;
  };
  error?: string;
}

/**
 * Service pour gérer l'upload de fichiers
 */
@Injectable({
  providedIn: 'root'
})
export class FileService {
  private readonly apiUrl = `${API_CONFIG.BASE_URL}/files`;

  constructor(private http: HttpClient) {}

  /**
   * Upload d'un document d'identité
   */
  uploadDocumentIdentite(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('documentIdentite', file);

    return this.http.post<FileUploadResponse>(`${this.apiUrl}/upload/document-identite`, formData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.filename;
          }
          throw new Error(response.error || 'Erreur lors de l\'upload du document');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Upload d'un diplôme
   */
  uploadDiplome(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('diplome', file);

    return this.http.post<FileUploadResponse>(`${this.apiUrl}/upload/diplome`, formData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.filename;
          }
          throw new Error(response.error || 'Erreur lors de l\'upload du diplôme');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Upload d'une photo de profil
   */
  uploadPhotoProfil(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('photoProfil', file);

    return this.http.post<FileUploadResponse>(`${this.apiUrl}/upload/photo-profil`, formData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.filename;
          }
          throw new Error(response.error || 'Erreur lors de l\'upload de la photo');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Gestionnaire d'erreurs
   */
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'Une erreur est survenue lors de l\'upload';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  };
}

