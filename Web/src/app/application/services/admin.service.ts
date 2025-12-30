import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { map, catchError } from "rxjs/operators";
import { API_CONFIG } from "@/infrastructure/config/api.config";
import { Medecin } from "@/domain/models";

/**
 * Interface pour la réponse de l'API admin
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Service d'administration
 * Gère les opérations administratives (vérification médecins, gestion utilisateurs)
 */
@Injectable({
  providedIn: "root",
})
export class AdminService {
  private readonly apiUrl = `${API_CONFIG.BASE_URL}/admin`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les statistiques d'administration
   */
  getStatistics(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/statistiques`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.error || 'Erreur lors de la récupération des statistiques');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère la liste des médecins en attente de vérification
   * @returns Observable avec la liste des médecins
   */
  getMedecinsEnAttente(): Observable<Medecin[]> {
    return this.http.get<ApiResponse<Medecin[]>>(`${this.apiUrl}/medecins/en-attente`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Valide un profil de médecin
   * @param medecinId - Identifiant du médecin
   * @returns Observable avec le résultat
   */
  validerMedecin(medecinId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/medecins/${medecinId}/valider`, {})
      .pipe(
        map(response => {
          if (response.success) {
            return response;
          }
          throw new Error(response.error || 'Erreur lors de la validation');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Rejette un profil de médecin
   * @param medecinId - Identifiant du médecin
   * @param motif - Motif du rejet (optionnel)
   * @returns Observable avec le résultat
   */
  rejeterMedecin(medecinId: string, motif?: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/medecins/${medecinId}/rejeter`, { motif })
      .pipe(
        map(response => {
          if (response.success) {
            return response;
          }
          throw new Error(response.error || 'Erreur lors du rejet');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Supprime un utilisateur
   * @param userId - Identifiant de l'utilisateur
   * @returns Observable vide
   */
  supprimerUtilisateur(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/utilisateurs/${userId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère tous les utilisateurs (pour l'admin)
   */
  getAllUsers(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/utilisateurs`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
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

