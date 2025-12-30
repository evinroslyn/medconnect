import { Platform } from "react-native";

/**
 * Configuration de l'API
 * - Android Emulator : 10.0.2.2 (alias pour localhost de la machine hôte)
 * - iOS Simulator : localhost
 * - Device physique : IP locale de la machine (ex: 192.168.1.100)
 */
const getBaseUrlInternal = () => {
  // Priorité à la variable d'environnement
  if (process.env.EXPO_PUBLIC_API_URL) {
    // Si l'URL contient /api, l'enlever pour obtenir la base URL
    const url = process.env.EXPO_PUBLIC_API_URL;
    return url.endsWith("/api") ? url.replace("/api", "") : url;
  }
  
  // Pour Android Emulator
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }
  
  // Pour iOS Simulator ou par défaut
  return "http://localhost:3000";
};

/**
 * Obtient l'URL de base de l'API (sans /api)
 */
export const getBaseUrl = (): string => {
  return getBaseUrlInternal();
};

/**
 * Obtient l'URL complète de l'API (avec /api)
 */
export const getApiUrl = (): string => {
  return `${getBaseUrlInternal()}/api`;
};

/**
 * Construit l'URL complète d'un fichier uploadé
 * @param filename - Nom du fichier (ex: "document-123.pdf")
 * @returns URL complète du fichier
 */
export const getFileUrl = (filename: string): string => {
  if (!filename) {
    return "";
  }
  
  // Si c'est déjà une URL complète, la retourner telle quelle
  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }
  
  // Si c'est un chemin qui commence par /uploads/, l'utiliser tel quel
  if (filename.startsWith("/uploads/")) {
    return `${getBaseUrl()}${filename}`;
  }
  
  // Sinon, c'est probablement juste le filename, donc on ajoute /uploads/
  return `${getBaseUrl()}/uploads/${filename}`;
};

/**
 * Construit l'URL de téléchargement d'un document médical
 * @param documentId - ID du document médical
 * @returns URL complète pour télécharger le document
 */
export const getDocumentDownloadUrl = (documentId: string): string => {
  return `${getApiUrl()}/documents-medicaux/${documentId}/download`;
};

/**
 * Construit l'URL d'une ressource API
 * @param endpoint - Endpoint de l'API (ex: "/patients/profile")
 * @returns URL complète
 */
export const getApiEndpointUrl = (endpoint: string): string => {
  // S'assurer que l'endpoint commence par /
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${getApiUrl()}${normalizedEndpoint}`;
};
