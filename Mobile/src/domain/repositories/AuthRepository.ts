import type { Result } from "../../shared/types/Result";
import type { Utilisateur, Patient, Medecin } from "../entities";

/**
 * Données d'inscription
 */
export interface RegisterData {
  telephone: string;
  motDePasse: string;
  typeUtilisateur: "patient" | "medecin";
  nom: string;
  mail: string; // Email obligatoire pour recevoir les codes de vérification
  adresse?: string;
  dateNaissance?: string;
  genre?: "Homme" | "Femme" | "Autre";
  specialite?: string;
  numeroLicence?: string;
  documentIdentite?: string;
}

/**
 * Données de connexion
 */
export interface LoginData {
  telephone: string;
  motDePasse: string;
  code2FA?: string;
}

/**
 * Réponse d'authentification
 */
export interface AuthResponse {
  token: string;
  user: Utilisateur | Patient | Medecin;
  require2FA?: boolean;
  qrCode2FA?: string;
}

/**
 * Interface du repository d'authentification
 * Définit les contrats pour l'authentification sans dépendre de l'implémentation
 */
export interface AuthRepository {
  /**
   * Inscription d'un nouvel utilisateur
   */
  register(data: RegisterData): Promise<Result<AuthResponse>>;

  /**
   * Connexion d'un utilisateur
   */
  login(data: LoginData): Promise<Result<AuthResponse>>;

  /**
   * Déconnexion
   */
  logout(): Promise<Result<void>>;

  /**
   * Récupération du profil utilisateur
   */
  getProfile(): Promise<Result<Utilisateur | Patient | Medecin>>;

  /**
   * Activation du 2FA
   */
  enable2FA(): Promise<Result<{ qrCode: string }>>;

  /**
   * Désactivation du 2FA
   */
  disable2FA(code2FA: string): Promise<Result<void>>;

  /**
   * Upload d'un document d'identité
   */
  uploadDocumentIdentite(fileUri: string, fileName: string): Promise<Result<{ path: string }>>;

  /**
   * Upload d'une photo de profil
   */
  uploadPhotoProfil(fileUri: string, fileName: string): Promise<Result<{ path: string }>>;

  /**
   * Demande de réinitialisation du mot de passe
   */
  requestPasswordReset(telephone: string): Promise<Result<{ message: string }>>;

  /**
   * Réinitialisation du mot de passe avec code de vérification
   */
  resetPassword(telephone: string, code: string, nouveauMotDePasse: string): Promise<Result<{ message: string }>>;

  /**
   * Mise à jour du profil utilisateur
   */
  updateProfile(updates: {
    nom?: string;
    mail?: string;
    telephone?: string;
    adresse?: string;
    photoProfil?: string;
    dateNaissance?: string;
    genre?: "Homme" | "Femme" | "Autre";
    specialite?: string;
  }): Promise<Result<Utilisateur | Patient | Medecin>>;
}

