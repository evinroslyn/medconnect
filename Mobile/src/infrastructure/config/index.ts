/**
 * Configuration de l'application
 * 
 * Note: Cette configuration est maintenant gérée par urlBuilder.ts
 * Conservez ce fichier pour compatibilité avec le code existant
 */

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000/api", // Pour Android Emulator
  TIMEOUT: 10000,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER: "user",
  REFRESH_TOKEN: "refresh_token",
} as const;

