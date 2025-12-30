import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

/**
 * Interface pour les données d'inscription
 */
export interface RegisterData {
  telephone: string;
  motDePasse?: string; // Optionnel pour les médecins (généré lors de la validation)
  typeUtilisateur: 'patient' | 'medecin' | 'administrateur';
  nom: string;
  mail: string; // Email obligatoire
  adresse?: string;
  dateNaissance?: string;
  genre?: 'Homme' | 'Femme' | 'Autre';
  specialite?: string;
  numeroLicence?: string;
  documentIdentite?: string; // Chemin vers le document d'identité
  diplome?: string; // Chemin vers le diplôme
  photoProfil?: string; // Chemin vers la photo de profil
}

/**
 * Interface pour les données de connexion
 */
export interface LoginData {
  telephone?: string;
  mail?: string;
  motDePasse: string;
  code2FA?: string;
}

/**
 * Interface pour la réponse d'authentification
 */
export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    telephone: string;
    typeUtilisateur: 'patient' | 'medecin' | 'administrateur';
    nom: string;
    require2FA?: boolean;
    qrCode2FA?: string;
  };
  message: string;
}

/**
 * Interface pour l'utilisateur
 */
export interface User {
  id: string;
  telephone: string;
  typeUtilisateur: 'patient' | 'medecin' | 'administrateur';
  nom: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE_URL = 'http://localhost:3000/api';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeAuth();
  }

  /**
   * Initialiser l'authentification au démarrage
   */
  private initializeAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userData = localStorage.getItem(this.USER_KEY);

    console.log('🔄 Initialisation AuthService:', {
      tokenPresent: !!token,
      userDataPresent: !!userData,
      tokenValue: token ? token.substring(0, 20) + '...' : null
    });

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        console.log('✅ Utilisateur restauré depuis localStorage:', user);
      } catch (error) {
        console.error('❌ Erreur lors du parsing des données utilisateur:', error);
        this.logout();
      }
    } else {
      console.warn('⚠️ Pas de token/userData trouvé lors de l\'initialisation');
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  register(data: RegisterData): Observable<AuthResponse> {
    console.log('📤 AuthService.register - Données envoyées:', JSON.stringify(data, null, 2));
    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/auth/register`, data)
      .pipe(
        tap(response => {
          console.log('✅ AuthService.register - Réponse reçue:', response);
          if (response.success && response.token && response.user) {
            this.saveAuthData(response.token, response.user);
          }
        }),
        catchError((error) => {
          console.error('❌ AuthService.register - Erreur:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Connexion d'un utilisateur
   */
  login(data: LoginData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/auth/login`, data)
      .pipe(
        tap(response => {
          console.log('📥 Réponse login complète dans AuthService:', JSON.stringify(response, null, 2));
          // Note: La sauvegarde du token est maintenant gérée dans le composant
          // pour garantir qu'elle se fait de manière synchrone avant la navigation
          if (response.success && response.token && response.user) {
            // Mettre à jour les BehaviorSubjects même si le token est sauvegardé dans le composant
            // Convertir response.user en User pour le typage
            const user: User = {
              id: response.user.id,
              telephone: response.user.telephone,
              typeUtilisateur: response.user.typeUtilisateur as 'patient' | 'medecin' | 'administrateur',
              nom: response.user.nom
            };
            this.currentUserSubject.next(user);
            this.isAuthenticatedSubject.next(true);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Déconnexion
   */
  logout(): Observable<any> {
    return this.http.post(`${this.API_BASE_URL}/auth/logout`, {})
      .pipe(
        catchError(() => {
          // Ignorer les erreurs de déconnexion côté serveur
          return new Observable(observer => observer.next({}));
        }),
        tap(() => {
          this.clearAuthData();
        })
      );
  }

  /**
   * Récupération du profil utilisateur
   */
  getProfile(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.API_BASE_URL}/auth/profile`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Activation du 2FA
   */
  enable2FA(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/auth/2fa/enable`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Désactivation du 2FA
   */
  disable2FA(code2FA: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/auth/2fa/disable`, {
      code2FA
    }).pipe(catchError(this.handleError));
  }

  /**
   * Demande de réinitialisation du mot de passe
   */
  requestPasswordReset(telephone: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_BASE_URL}/auth/forgot-password`, {
      telephone
    }).pipe(catchError(this.handleError));
  }

  /**
   * Réinitialisation du mot de passe avec code de vérification
   */
  resetPassword(telephone: string, code: string, nouveauMotDePasse: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_BASE_URL}/auth/reset-password`, {
      telephone,
      code,
      nouveauMotDePasse
    }).pipe(catchError(this.handleError));
  }

  /**
   * Récupérer le token d'authentification
   */
  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      console.warn('⚠️ getToken() retourne null. TOKEN_KEY:', this.TOKEN_KEY);
    }
    return token;
  }

  /**
   * Récupérer l'utilisateur actuel
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(role: 'patient' | 'medecin' | 'administrateur'): boolean {
    const user = this.getCurrentUser();
    return user?.typeUtilisateur === role;
  }

  /**
   * Sauvegarder les données d'authentification
   * Méthode publique pour permettre la sauvegarde depuis les composants
   */
  public saveAuthData(token: string, user: any): void {
    console.log('💾 Sauvegarde du token...', 'TOKEN_KEY:', this.TOKEN_KEY, 'Token:', token.substring(0, 20) + '...');
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    // Vérifier que le token a bien été sauvegardé
    const savedToken = localStorage.getItem(this.TOKEN_KEY);
    if (savedToken) {
      console.log('✅ Token sauvegardé avec succès:', savedToken.substring(0, 20) + '...');
    } else {
      console.error('❌ ERREUR: Token non sauvegardé dans localStorage!');
    }

    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Effacer les données d'authentification
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Gestionnaire d'erreurs
   */
  private handleError = (error: any): Observable<never> => {
    console.error('🔴 AuthService.handleError - Erreur complète:', error);
    console.error('🔴 error.error:', error.error);
    console.error('🔴 error.status:', error.status);
    
    let errorMessage = 'Une erreur est survenue';

    // Le backend envoie les erreurs dans error.error avec cette structure:
    // { success: false, error: "...", message: "...", details: [...] }
    if (error.error) {
      // Priorité 1: message détaillé avec détails de validation
      if (error.error.message) {
        errorMessage = error.error.message;
        
        // Ajouter les détails de validation s'ils existent
        if (error.error.details && Array.isArray(error.error.details) && error.error.details.length > 0) {
          const detailsText = error.error.details
            .map((d: any) => `• ${d.field}: ${d.message}`)
            .join('\n');
          errorMessage += '\n\nDétails:\n' + detailsText;
        }
      } 
      // Priorité 2: champ error
      else if (error.error.error) {
        errorMessage = error.error.error;
      } 
      // Priorité 3: string directe
      else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
    } 
    // Fallback: message d'erreur standard
    else if (error.message) {
      errorMessage = error.message;
    }

    // Si erreur 401, déconnecter l'utilisateur
    if (error.status === 401) {
      this.clearAuthData();
    }

    console.error('🔴 Message d\'erreur final:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}
