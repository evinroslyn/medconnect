import { SettingsService } from "../../application/services/SettingsService";
import type {
  NotificationPreferences,
  PrivacyPreferences,
  AppSettings,
} from "../../application/services/SettingsService";

/**
 * Hook pour gérer les paramètres et préférences
 */
export function useSettings() {
  return {
    getNotificationPreferences: SettingsService.getNotificationPreferences,
    saveNotificationPreferences: SettingsService.saveNotificationPreferences,
    getPrivacyPreferences: SettingsService.getPrivacyPreferences,
    savePrivacyPreferences: SettingsService.savePrivacyPreferences,
    getAppSettings: SettingsService.getAppSettings,
    saveAppSettings: SettingsService.saveAppSettings,
  };
}

export type {
  NotificationPreferences,
  PrivacyPreferences,
  AppSettings,
};

