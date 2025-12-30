import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { catchError, map } from "rxjs/operators";
import { RendezVous, Disponibilite } from "@/domain/models";
import { API_CONFIG } from "@/infrastructure/config/api.config";

/**
 * Service de gestion des rendez-vous et disponibilités
 */
@Injectable({
  providedIn: "root",
})
export class RendezVousService {
  private readonly apiUrl = `${API_CONFIG.BASE_URL}/rendez-vous`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les rendez-vous du médecin
   */
  getRendezVous(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/medecin`).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si l'endpoint n'existe pas encore (404), retourner un objet avec data vide
        if (error.status === 404) {
          console.warn('⚠️ Endpoint /medecin non disponible, retour d\'un tableau vide');
          return of({ success: true, data: [] });
        }
        // Pour les autres erreurs, propager l'erreur
        throw error;
      })
    );
  }

  /**
   * Crée un nouveau rendez-vous
   */
  createRendezVous(rendezVous: Omit<RendezVous, 'id' | 'statut'>): Observable<RendezVous> {
    return this.http.post<RendezVous>(this.apiUrl, rendezVous);
  }

  /**
   * Annule un rendez-vous
   */
  annulerRendezVous(rendezVousId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${rendezVousId}/annuler`, {});
  }

  /**
   * Récupère les disponibilités du médecin
   */
  getDisponibilites(): Observable<Disponibilite[]> {
    return this.http.get<any>(`${this.apiUrl}/disponibilites`).pipe(
      map((response: any) => {
        // Si la réponse est un objet avec data
        if (response && response.data) {
          return response.data;
        }
        // Si c'est directement un tableau
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError((error: HttpErrorResponse) => {
        // Si l'endpoint n'existe pas encore (404), retourner un tableau vide
        if (error.status === 404) {
          console.warn('⚠️ Endpoint /disponibilites non disponible, retour d\'un tableau vide');
          return of([]);
        }
        // Pour les autres erreurs, propager l'erreur
        throw error;
      })
    );
  }

  /**
   * Crée une nouvelle disponibilité
   */
  createDisponibilite(disponibilite: Omit<Disponibilite, 'id'>): Observable<Disponibilite> {
    return this.http.post<any>(`${this.apiUrl}/disponibilites`, disponibilite).pipe(
      map((response: any) => {
        // Si la réponse est un objet avec data
        if (response && response.data) {
          return response.data;
        }
        // Sinon, retourner la réponse directement
        return response;
      })
    );
  }

  /**
   * Met à jour une disponibilité
   */
  updateDisponibilite(id: string, disponibilite: Partial<Disponibilite>): Observable<Disponibilite> {
    return this.http.patch<any>(`${this.apiUrl}/disponibilites/${id}`, disponibilite).pipe(
      map((response: any) => {
        // Si la réponse est un objet avec data
        if (response && response.data) {
          return response.data;
        }
        // Sinon, retourner la réponse directement
        return response;
      })
    );
  }

  /**
   * Supprime une disponibilité
   */
  deleteDisponibilite(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/disponibilites/${id}`);
  }
}

