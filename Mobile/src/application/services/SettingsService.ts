import { storageService } from "../../infrastructure/storage/StorageService";

/**
 * Types pour les préférences de notifications
 */
export interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  medicalRecordsUpdates: boolean;
  messages: boolean;
}

/**
 * Types pour les préférences de confidentialité
 */
export interface PrivacyPreferences {
  profileVisibility: boolean;
  shareMedicalRecords: boolean;
  allowDataCollection: boolean;
  biometricAuth: boolean;
}

/**
 * Types pour les paramètres de l'application
 */
export interface AppSettings {
  darkMode: boolean;
  language: string;
  autoSync: boolean;
  cacheData: boolean;
}

const STORAGE_KEYS = {
  NOTIFICATION_PREFERENCES: "notification_preferences",
  PRIVACY_PREFERENCES: "privacy_preferences",
  APP_SETTINGS: "app_settings",
};

/**
 * Service de gestion des paramètres et préférences
 */
export class SettingsService {
  /**
   * Récupère les préférences de notifications
   */
  static async getNotificationPreferences(): Promise<NotificationPreferences> {
    const preferences = await storageService.getItem<NotificationPreferences>(
      STORAGE_KEYS.NOTIFICATION_PREFERENCES
    );

    // Valeurs par défaut
    return (
      preferences || {
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        appointmentReminders: true,
        medicalRecordsUpdates: true,
        messages: true,
      }
    );
  }

  /**
   * Sauvegarde les préférences de notifications
   */
  static async saveNotificationPreferences(
    preferences: NotificationPreferences
  ): Promise<void> {
    await storageService.setItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES, preferences);
  }

  /**
   * Récupère les préférences de confidentialité
   */
  static async getPrivacyPreferences(): Promise<PrivacyPreferences> {
    const preferences = await storageService.getItem<PrivacyPreferences>(
      STORAGE_KEYS.PRIVACY_PREFERENCES
    );

    // Valeurs par défaut
    return (
      preferences || {
        profileVisibility: true,
        shareMedicalRecords: false,
        allowDataCollection: false,
        biometricAuth: false,
      }
    );
  }

  /**
   * Sauvegarde les préférences de confidentialité
   */
  static async savePrivacyPreferences(preferences: PrivacyPreferences): Promise<void> {
    await storageService.setItem(STORAGE_KEYS.PRIVACY_PREFERENCES, preferences);
  }

  /**
   * Récupère les paramètres de l'application
   */
  static async getAppSettings(): Promise<AppSettings> {
    const settings = await storageService.getItem<AppSettings>(STORAGE_KEYS.APP_SETTINGS);

    // Valeurs par défaut
    return (
      settings || {
        darkMode: false,
        language: "Français",
        autoSync: true,
        cacheData: true,
      }
    );
  }

  /**
   * Sauvegarde les paramètres de l'application
   */
  static async saveAppSettings(settings: AppSettings): Promise<void> {
    await storageService.setItem(STORAGE_KEYS.APP_SETTINGS, settings);
  }
}

