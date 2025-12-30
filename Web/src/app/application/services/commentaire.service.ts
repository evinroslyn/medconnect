import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API_CONFIG } from '@/infrastructure/config/api.config';

/**
 * Interface pour un commentaire
 */
export interface Commentaire {
  id: string;
  idDossierMedical?: string;
  idDocumentMedical?: string;
  idMedecin: string;
  contenu: string;
  dateCreation: string;
  medecinNom?: string;
}

/**
 * Interface pour créer un commentaire
 */
export interface CreateCommentaireData {
  idDossierMedical?: string;
  idDocumentMedical?: string;
  contenu: string;
}

/**
 * Service pour gérer les commentaires sur les documents et dossiers médicaux
 */
@Injectable({
  providedIn: 'root'
})
export class CommentaireService {
  private readonly apiUrl = `${API_CONFIG.BASE_URL}/commentaires`;

  constructor(private http: HttpClient) {}

  /**
   * Crée un commentaire sur un document ou dossier médical
   * @param data - Données du commentaire
   * @returns Observable avec le commentaire créé
   */
  createCommentaire(data: CreateCommentaireData): Observable<Commentaire> {
    return this.http.post<{ success: boolean; data: Commentaire }>(this.apiUrl, data).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Erreur lors de la création du commentaire:', error);
        throw error;
      })
    );
  }

  /**
   * Récupère les commentaires d'un document médical
   * @param documentId - Identifiant du document
   * @returns Observable avec la liste des commentaires
   */
  getCommentairesByDocument(documentId: string): Observable<Commentaire[]> {
    return this.http.get<{ success: boolean; data: Commentaire[] }>(`${this.apiUrl}/document/${documentId}`).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Erreur lors de la récupération des commentaires:', error);
        throw error;
      })
    );
  }

  /**
   * Récupère les commentaires d'un dossier médical
   * @param dossierId - Identifiant du dossier
   * @returns Observable avec la liste des commentaires
   */
  getCommentairesByDossier(dossierId: string): Observable<Commentaire[]> {
    return this.http.get<{ success: boolean; data: Commentaire[] }>(`${this.apiUrl}/dossier/${dossierId}`).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Erreur lors de la récupération des commentaires:', error);
        throw error;
      })
    );
  }

  /**
   * Supprime un commentaire
   * @param commentaireId - Identifiant du commentaire
   * @returns Observable vide
   */
  deleteCommentaire(commentaireId: string): Observable<void> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${commentaireId}`).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Erreur lors de la suppression du commentaire:', error);
        throw error;
      })
    );
  }
}

