import type { Result } from "../../shared/types/Result";
import type { AuthRepository, LoginData, RegisterData, AuthResponse } from "../../domain/repositories/AuthRepository";
import type { Utilisateur, Patient, Medecin } from "../../domain/entities";
import { LoginUseCase } from "../usecases/LoginUseCase";
import { RegisterUseCase } from "../usecases/RegisterUseCase";
import { GetProfileUseCase } from "../usecases/GetProfileUseCase";

/**
 * Service applicatif d'authentification
 * Orchestre les use cases d'authentification
 */
export class AuthService {
  private readonly loginUseCase: LoginUseCase;
  private readonly registerUseCase: RegisterUseCase;
  private readonly getProfileUseCase: GetProfileUseCase;
  private readonly authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
    this.loginUseCase = new LoginUseCase(authRepository);
    this.registerUseCase = new RegisterUseCase(authRepository);
    this.getProfileUseCase = new GetProfileUseCase(authRepository);
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(data: LoginData): Promise<Result<AuthResponse>> {
    return this.loginUseCase.execute(data);
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(data: RegisterData): Promise<Result<AuthResponse>> {
    return this.registerUseCase.execute(data);
  }

  /**
   * Récupération du profil utilisateur
   */
  async getProfile(): Promise<Result<Utilisateur | Patient | Medecin>> {
    return this.getProfileUseCase.execute();
  }

  /**
   * Alias pour getProfile (pour compatibilité avec l'ancien code)
   */
  async getUser(): Promise<Utilisateur | Patient | Medecin | null> {
    const result = await this.getProfile();
    return result.ok ? result.value : null;
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<Result<void>> {
    return this.authRepository.logout();
  }

  /**
   * Activation du 2FA
   */
  async enable2FA(): Promise<Result<{ qrCode: string }>> {
    return this.authRepository.enable2FA();
  }

  /**
   * Désactivation du 2FA
   */
  async disable2FA(code2FA: string): Promise<Result<void>> {
    return this.authRepository.disable2FA(code2FA);
  }

  /**
   * Upload d'un document d'identité
   */
  async uploadDocumentIdentite(fileUri: string, fileName: string): Promise<Result<{ path: string }>> {
    return this.authRepository.uploadDocumentIdentite(fileUri, fileName);
  }

  /**
   * Upload d'une photo de profil
   */
  async uploadPhotoProfil(fileUri: string, fileName: string): Promise<Result<{ path: string }>> {
    return this.authRepository.uploadPhotoProfil(fileUri, fileName);
  }

  /**
   * Demande de réinitialisation du mot de passe
   */
  async requestPasswordReset(telephone: string): Promise<Result<{ message: string }>> {
    return this.authRepository.requestPasswordReset(telephone);
  }

  /**
   * Réinitialisation du mot de passe avec code de vérification
   */
  async resetPassword(telephone: string, code: string, nouveauMotDePasse: string): Promise<Result<{ message: string }>> {
    return this.authRepository.resetPassword(telephone, code, nouveauMotDePasse);
  }

  /**
   * Mise à jour du profil utilisateur
   */
  async updateProfile(updates: {
    nom?: string;
    mail?: string;
    telephone?: string;
    adresse?: string;
    photoProfil?: string;
    dateNaissance?: string;
    genre?: "Homme" | "Femme" | "Autre";
    specialite?: string;
  }): Promise<Result<Utilisateur | Patient | Medecin>> {
    return this.authRepository.updateProfile(updates);
  }
}

