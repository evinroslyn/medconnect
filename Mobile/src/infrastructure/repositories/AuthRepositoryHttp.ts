import type { Result } from "../../shared/types/Result";
import type {
  AuthRepository,
  RegisterData,
  LoginData,
  AuthResponse,
} from "../../domain/repositories/AuthRepository";
import type { Utilisateur } from "../../domain/entities";
import { httpClient } from "../http/httpClient";
import { storageService } from "../storage/StorageService";
import { STORAGE_KEYS } from "../config";
import { ok, err } from "../../shared/types/Result";

/**
 * Implémentation HTTP du repository d'authentification
 */
export class AuthRepositoryHttp implements AuthRepository {
  async register(data: RegisterData): Promise<Result<AuthResponse>> {
    const result = await httpClient.post<{
      success: boolean;
      token?: string;
      user?: any;
      require2FA?: boolean;
      qrCode2FA?: string;
      message: string;
      error?: string;
      details?: { field: string; message: string }[];
    }>("/auth/register", data);

    if (!result.ok) {
      return err(result.error);
    }

    const response = result.value;
    if (!response.success) {
      // Construire un message d'erreur détaillé
      let errorMessage = response.message || response.error || "Erreur lors de l'inscription";
      
      // Ajouter les détails de validation si disponibles
      if (response.details && response.details.length > 0) {
        const detailsMessages = response.details.map(d => `• ${d.field}: ${d.message}`).join("\n");
        errorMessage = `${errorMessage}\n\nDétails :\n${detailsMessages}`;
      }
      
      return err(errorMessage);
    }
    
    if (!response.token || !response.user) {
      return err(response.message || "Erreur lors de l'inscription : réponse incomplète");
    }

    // Sauvegarder le token et l'utilisateur
    await storageService.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
    await storageService.setItem(STORAGE_KEYS.USER, response.user);

    return ok({
      token: response.token,
      user: response.user as Utilisateur,
      require2FA: response.require2FA,
      qrCode2FA: response.qrCode2FA,
    });
  }

  async login(data: LoginData): Promise<Result<AuthResponse>> {
    const result = await httpClient.post<{
      success: boolean;
      token?: string;
      user?: any;
      require2FA?: boolean;
      qrCode2FA?: string;
      message: string;
      error?: string;
      details?: { field: string; message: string }[];
    }>("/auth/login", data);

    if (!result.ok) {
      return err(result.error);
    }

    const response = result.value;
    
    console.log("AuthRepositoryHttp - Login response:", JSON.stringify(response, null, 2));
    
    // Vérifier si 2FA est requis (peut être dans user.require2FA ou directement require2FA)
    const requires2FA = response.user?.require2FA || response.require2FA;
    
    console.log("AuthRepositoryHttp - requires2FA:", requires2FA, "user:", response.user);
    
    // Si 2FA est requis, retourner même si success=false
    if (requires2FA) {
      console.log("AuthRepositoryHttp - Returning 2FA required response");
      return ok({
        token: "",
        user: response.user as Utilisateur,
        require2FA: true,
        qrCode2FA: response.qrCode2FA,
      });
    }
    
    if (!response.success) {
      // Construire un message d'erreur détaillé
      let errorMessage = response.message || response.error || "Erreur lors de la connexion";
      
      // Ajouter les détails de validation si disponibles
      if (response.details && response.details.length > 0) {
        const detailsMessages = response.details.map(d => `• ${d.field}: ${d.message}`).join("\n");
        errorMessage = `${errorMessage}\n\nDétails :\n${detailsMessages}`;
      }
      
      return err(errorMessage);
    }

    // Sauvegarder le token et l'utilisateur
    if (response.token && response.user) {
      await storageService.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
      await storageService.setItem(STORAGE_KEYS.USER, response.user);
    }

    return ok({
      token: response.token || "",
      user: response.user as Utilisateur,
    });
  }

  async logout(): Promise<Result<void>> {
    try {
      await httpClient.post("/auth/logout");
    } catch {
      // Ignorer les erreurs de déconnexion côté serveur
    } finally {
      await storageService.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await storageService.removeItem(STORAGE_KEYS.USER);
    }
    return ok(undefined);
  }

  async getProfile(): Promise<Result<Utilisateur>> {
    try {
    const result = await httpClient.get<{
      success: boolean;
      user?: any;
      message: string;
    }>("/auth/profile");

    if (!result.ok) {
        console.error("[AuthRepositoryHttp] getProfile error:", result.error);
      return err(result.error);
    }

    const response = result.value;
    if (!response.success || !response.user) {
        const errorMsg = response.message || "Erreur lors de la récupération du profil";
        console.error("[AuthRepositoryHttp] getProfile - Invalid response:", response);
        return err(errorMsg);
    }

    return ok(response.user as Utilisateur);
    } catch (error: any) {
      console.error("[AuthRepositoryHttp] getProfile exception:", error);
      return err(error.message || "Erreur lors de la récupération du profil");
    }
  }

  async enable2FA(): Promise<Result<{ qrCode: string }>> {
    const result = await httpClient.post<{
      success: boolean;
      qrCode?: string;
      message: string;
    }>("/auth/2fa/enable");

    if (!result.ok) {
      return err(result.error);
    }

    const response = result.value;
    if (!response.success || !response.qrCode) {
      return err(response.message || "Erreur lors de l'activation du 2FA");
    }

    return ok({ qrCode: response.qrCode });
  }

  async disable2FA(code2FA: string): Promise<Result<void>> {
    const result = await httpClient.post<{
      success: boolean;
      message: string;
    }>("/auth/2fa/disable", { code2FA });

    if (!result.ok) {
      return err(result.error);
    }

    const response = result.value;
    if (!response.success) {
      return err(response.message || "Erreur lors de la désactivation du 2FA");
    }

    return ok(undefined);
  }

  async uploadDocumentIdentite(
    fileUri: string,
    fileName: string
  ): Promise<Result<{ path: string }>> {
    const formData = new FormData();
    formData.append("documentIdentite", {
      uri: fileUri,
      type: "image/jpeg",
      name: fileName,
    } as any);

    // Ne pas définir Content-Type manuellement pour multipart/form-data
    // Axios le définira automatiquement avec le boundary correct
    const result = await httpClient.post<{
      success: boolean;
      path?: string;
      message: string;
    }>("/files/upload/document-identite", formData);

    if (!result.ok) {
      return err(result.error);
    }

    const response = result.value;
    if (!response.success || !response.path) {
      return err(response.message || "Erreur lors de l'upload du document");
    }

    return ok({ path: response.path });
  }

  async uploadPhotoProfil(
    fileUri: string,
    fileName: string
  ): Promise<Result<{ path: string }>> {
    const formData = new FormData();
    formData.append("photoProfil", {
      uri: fileUri,
      type: "image/jpeg",
      name: fileName,
    } as any);

    const result = await httpClient.post<{
      success: boolean;
      data?: {
        path: string;
        url: string;
      };
      message: string;
    }>("/files/upload/photo-profil", formData);

    if (!result.ok) {
      return err(result.error);
    }

    const response = result.value;
    if (!response.success || !response.data?.path) {
      return err(response.message || "Erreur lors de l'upload de la photo");
    }

    // Utiliser l'URL relative si disponible, sinon utiliser le path
    // Le path du backend est au format "/uploads/filename.jpg"
    // On doit le convertir en format relatif pour le mobile
    let photoPath = response.data.path;
    if (photoPath.startsWith('/uploads/')) {
      photoPath = photoPath; // Garder tel quel
    } else if (photoPath.includes('uploads')) {
      // Extraire la partie après "uploads"
      const uploadsIndex = photoPath.indexOf('uploads');
      photoPath = '/' + photoPath.substring(uploadsIndex);
    } else {
      // Si c'est juste un nom de fichier, ajouter le préfixe
      photoPath = `/uploads/${photoPath}`;
    }

    console.log("[AuthRepositoryHttp] Photo uploadée, path:", photoPath);
    return ok({ path: photoPath });
  }

  async deleteAccount(): Promise<Result<void>> {
    const result = await httpClient.delete<{
      success: boolean;
      message: string;
    }>("/auth/account");

    if (!result.ok) {
      return err(result.error);
    }

    const response = result.value;
    if (!response.success) {
      return err(response.message || "Erreur lors de la suppression du compte");
    }

    // Supprimer les données locales
    await storageService.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await storageService.removeItem(STORAGE_KEYS.USER);
    await storageService.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

    return ok(undefined);
  }

  async requestPasswordReset(telephone: string): Promise<Result<{ message: string }>> {
    try {
      const result = await httpClient.post<{
        success: boolean;
        message: string;
      }>("/auth/forgot-password", { telephone });

      if (!result.ok) {
        return err(result.error);
      }

      return ok({ message: result.value.message });
    } catch (error: any) {
      console.error("[AuthRepositoryHttp] requestPasswordReset exception:", error);
      return err(error.message || "Erreur lors de la demande de réinitialisation");
    }
  }

  async resetPassword(
    telephone: string,
    code: string,
    nouveauMotDePasse: string
  ): Promise<Result<{ message: string }>> {
    try {
      const result = await httpClient.post<{
        success: boolean;
        message: string;
      }>("/auth/reset-password", {
        telephone,
        code,
        nouveauMotDePasse,
      });

      if (!result.ok) {
        return err(result.error);
      }

      return ok({ message: result.value.message });
    } catch (error: any) {
      console.error("[AuthRepositoryHttp] resetPassword exception:", error);
      return err(error.message || "Erreur lors de la réinitialisation du mot de passe");
    }
  }

  async updateProfile(updates: {
    nom?: string;
    mail?: string;
    telephone?: string;
    adresse?: string;
    photoProfil?: string;
    dateNaissance?: string;
    genre?: "Homme" | "Femme" | "Autre";
    specialite?: string;
  }): Promise<Result<Utilisateur>> {
    try {
      const result = await httpClient.patch<{
        success: boolean;
        user?: any;
        message: string;
      }>("/auth/profile", updates);

      if (!result.ok) {
        return err(result.error);
      }

      const response = result.value;
      if (!response.success || !response.user) {
        return err(response.message || "Erreur lors de la mise à jour du profil");
      }

      return ok(response.user as Utilisateur);
    } catch (error: any) {
      console.error("[AuthRepositoryHttp] updateProfile exception:", error);
      return err(error.message || "Erreur lors de la mise à jour du profil");
    }
  }
}

