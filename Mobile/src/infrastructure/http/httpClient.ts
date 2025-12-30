import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import type { Result } from "../../shared/types/Result";
import { ok, err } from "../../shared/types/Result";
import { STORAGE_KEYS } from "../config";
import { storageService } from "../storage/StorageService";

/**
 * Configuration de l'API
 * - Android Emulator : 10.0.2.2 (alias pour localhost de la machine hôte)
 * - iOS Simulator : localhost
 * - Device physique : IP locale de la machine (détectée automatiquement ou configurée)
 */
/**
 * Extrait l'IP locale depuis l'URL Expo
 */
const getLocalIPFromExpo = (): string | null => {
  try {
    // Essayer d'obtenir l'IP depuis Constants.expoConfig
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      // hostUri est au format "192.168.1.100:8081"
      const ip = hostUri.split(":")[0];
      if (ip && ip !== "localhost" && ip !== "127.0.0.1" && ip !== "10.0.2.2") {
        console.log(`[HTTP Client] IP détectée depuis hostUri: ${ip}`);
        return ip;
      }
    }
    
    // Essayer depuis Constants.manifest (ancienne API)
    const manifestHostUri = (Constants.manifest as any)?.hostUri;
    if (manifestHostUri) {
      const ip = manifestHostUri.split(":")[0];
      if (ip && ip !== "localhost" && ip !== "127.0.0.1" && ip !== "10.0.2.2") {
        console.log(`[HTTP Client] IP détectée depuis manifest.hostUri: ${ip}`);
        return ip;
      }
    }
    
    // Essayer depuis debuggerHost (propriété non typée)
    const debuggerHost = (Constants.expoConfig as any)?.debuggerHost;
    if (debuggerHost) {
      const ip = debuggerHost.split(":")[0];
      if (ip && ip !== "localhost" && ip !== "127.0.0.1" && ip !== "10.0.2.2") {
        console.log(`[HTTP Client] IP détectée depuis debuggerHost: ${ip}`);
        return ip;
      }
    }
    
    // Essayer depuis manifest2 (nouvelle API Expo)
    const manifest2 = (Constants as any).manifest2;
    if (manifest2?.extra?.expoGo?.debuggerHost) {
      const ip = manifest2.extra.expoGo.debuggerHost.split(":")[0];
      if (ip && ip !== "localhost" && ip !== "127.0.0.1" && ip !== "10.0.2.2") {
        console.log(`[HTTP Client] IP détectée depuis manifest2: ${ip}`);
        return ip;
      }
    }
    
    console.log("[HTTP Client] Aucune IP locale détectée automatiquement");
  } catch (error) {
    console.warn("[HTTP Client] Erreur lors de la détection de l'IP:", error);
  }
  
  return null;
};

/**
 * Obtient l'URL de base de l'API (sans /api)
 */
const getBaseUrl = () => {
  // Priorité à la variable d'environnement
  if (process.env.EXPO_PUBLIC_API_URL) {
    // Si l'URL contient /api, l'enlever
    let url = process.env.EXPO_PUBLIC_API_URL.replace("/api", "");
    // Si l'URL ne contient pas http:// ou https://, l'ajouter
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `http://${url}`;
    }
    return url;
  }
  
  // Pour Android Emulator (détection basique)
  if (Platform.OS === "android") {
    // Essayer de détecter si on est sur un émulateur
    // Si on peut obtenir une IP locale, on est probablement sur un appareil physique
    const localIP = getLocalIPFromExpo();
    if (localIP) {
      console.log(`[HTTP Client] IP locale détectée: ${localIP}`);
      return `http://${localIP}:3000`;
    }
    // Sinon, on assume que c'est un émulateur
    return "http://10.0.2.2:3000";
  }
  
  // Pour iOS Simulator ou par défaut
  const localIP = getLocalIPFromExpo();
  if (localIP) {
    console.log(`[HTTP Client] IP locale détectée: ${localIP}`);
    return `http://${localIP}:3000`;
  }
  
  return "http://localhost:3000";
};

/**
 * Obtient l'URL complète de l'API (avec /api)
 */
const getApiBaseUrl = () => {
  return `${getBaseUrl()}/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Exporter getBaseUrl pour utilisation dans urlBuilder
export { getBaseUrl };

// Log de l'URL de base pour debug
console.log(`[HTTP Client] API Base URL: ${API_BASE_URL}, Platform: ${Platform.OS}`);

/**
 * Client HTTP avec gestion d'erreurs via Result
 */
class HttpClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000, // Augmenter le timeout à 60s pour les uploads de fichiers
      // Configuration spécifique pour React Native
      // Note: Axios sérialise automatiquement les objets en JSON si Content-Type est application/json
      // Mais dans React Native, il peut y avoir des problèmes, donc on force la sérialisation
      transformRequest: [
        (data, headers) => {
          // Pour FormData, ne pas transformer - laisser axios gérer
          if (data instanceof FormData) {
            // Supprimer Content-Type pour que axios le définisse avec le boundary
            if (headers) {
              delete headers["Content-Type"];
            }
            return data;
          }
          
          // Pour les objets JavaScript, sérialiser en JSON explicitement
          if (data && typeof data === "object") {
            // Vérifier que ce n'est pas un type spécial qui ne doit pas être sérialisé
            if (
              data instanceof ArrayBuffer ||
              data instanceof Blob ||
              data instanceof File ||
              data instanceof URLSearchParams
            ) {
              return data;
            }
            
            // Sérialiser en JSON et définir le Content-Type
            const jsonString = JSON.stringify(data);
            if (headers) {
              headers["Content-Type"] = "application/json";
            }
            console.log(`[HTTP Client] transformRequest - Serialized data:`, {
              originalType: typeof data,
              serializedLength: jsonString.length,
              preview: jsonString.substring(0, 200),
            });
            return jsonString;
          }
          
          // Pour les autres types (string, number, etc.), retourner tel quel
          return data;
        },
      ],
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Intercepteur pour ajouter le token JWT aux requêtes
    this.client.interceptors.request.use(
      async (config) => {
        const token = await storageService.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          // S'assurer que le header Authorization est toujours ajouté
          // Même pour les requêtes multipart/form-data
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.warn("[HTTP Client] No auth token found");
        }
        
        // Définir Content-Type pour les requêtes JSON (mais pas pour FormData)
        if (!(config.data instanceof FormData)) {
          config.headers = config.headers || {};
          // Toujours définir Content-Type pour les requêtes JSON
          // IMPORTANT: Doit être défini AVANT que transformRequest ne sérialise
          config.headers["Content-Type"] = "application/json";
          
          // Si les données sont un objet et ne sont pas déjà une string, 
          // s'assurer qu'elles seront sérialisées par transformRequest
          if (config.data && typeof config.data === "object" && typeof config.data !== "string") {
            // Le transformRequest devrait déjà gérer cela, mais on vérifie
            console.log(`[HTTP Client] Interceptor - Data before transform:`, {
              type: typeof config.data,
              isObject: typeof config.data === "object",
              keys: Object.keys(config.data),
            });
          }
        } else {
          // Pour FormData, s'assurer qu'aucun Content-Type n'est défini
          // React Native FormData gère cela automatiquement
          if (config.headers) {
            delete config.headers["Content-Type"];
          }
        }
        
        // Log pour debug
        if (process.env.NODE_ENV === "development" && !(config.data instanceof FormData)) {
          console.log(`[HTTP Client] Request config:`, {
            method: config.method,
            url: config.url,
            hasData: !!config.data,
            dataType: typeof config.data,
            dataKeys: config.data && typeof config.data === "object" ? Object.keys(config.data) : [],
            contentType: config.headers?.["Content-Type"],
            dataPreview: config.data && typeof config.data === "object" ? JSON.stringify(config.data).substring(0, 200) : (typeof config.data === "string" ? config.data.substring(0, 200) : String(config.data)),
          });
        }
        
        return config;
      },
      (error) => {
        console.error("[HTTP Client] Request interceptor error:", error);
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les erreurs de réponse
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expiré ou invalide, déconnecter l'utilisateur
          await storageService.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          await storageService.removeItem(STORAGE_KEYS.USER);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Effectue une requête GET
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<Result<T>> {
    try {
      // Utiliser fetch pour plus de fiabilité dans React Native
      const token = await storageService.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
      const fullUrl = `${API_BASE_URL}${url}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      // Créer un AbortController pour le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // Timeout de 60 secondes
      
      const response = await fetch(fullUrl, {
        method: "GET",
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Lire le texte de la réponse une seule fois (response.text() ne peut être appelé qu'une fois)
      const textResponse = await response.text().catch(() => "");
      const contentType = response.headers.get("content-type");
      
      // Log détaillé pour debug
      console.log(`[HTTP Client] GET ${url}`);
      console.log(`[HTTP Client] Status: ${response.status}, Content-Type: ${contentType}`);
      console.log(`[HTTP Client] Has token: ${!!token}`);
      console.log(`[HTTP Client] Response length: ${textResponse.length}`);
      console.log(`[HTTP Client] Response preview (first 500 chars):`, textResponse.substring(0, 500));

      if (!response.ok) {
        // Si erreur 401 (Non autorisé), supprimer le token invalide seulement si on en avait un
        if (response.status === 401 && token) {
          console.warn("[HTTP Client] Token invalide ou expiré, suppression du token");
          await storageService.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          await storageService.removeItem(STORAGE_KEYS.USER);
        }
        
        // Vérifier si la réponse est du JSON
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = JSON.parse(textResponse);
            const errorMessage = errorData.message || errorData.error || `Erreur ${response.status}: ${response.statusText}`;
            return err(errorMessage);
          } catch {
            return err(`Erreur ${response.status}: ${response.statusText}`);
          }
        } else {
          // La réponse n'est pas du JSON (probablement HTML ou texte)
          if (response.status === 404) {
            return err(`Route non trouvée: ${url}. Vérifiez que le backend est démarré et que la route existe.`);
          }
          
          // Vérifier si c'est une page HTML d'erreur Express
          if (textResponse.includes("Cannot GET") || textResponse.includes("Cannot POST") || textResponse.includes("<!DOCTYPE")) {
            return err(`Le backend n'est pas démarré ou la route ${url} n'existe pas. Démarrez le backend avec: cd Backend && npm run dev`);
          }
          
          return err(`Erreur ${response.status}: ${response.statusText}. Réponse: ${textResponse.substring(0, 100)}`);
        }
      }

      // Vérifier que la réponse est du JSON avant de parser
      if (!contentType || !contentType.includes("application/json")) {
        console.error(`[HTTP Client] Expected JSON but got ${contentType}. Response:`, textResponse.substring(0, 200));
        
        // Si c'est une page HTML d'erreur Express, donner un message plus clair
        if (textResponse.includes("Cannot GET") || textResponse.includes("Cannot POST") || textResponse.includes("<!DOCTYPE")) {
          return err(`Le backend n'est pas démarré ou la route ${url} n'existe pas. Vérifiez que le serveur tourne sur http://localhost:3000`);
        }
        
        return err(`Le serveur a retourné une réponse non-JSON (${contentType}). Vérifiez que le backend est démarré et accessible sur ${API_BASE_URL.replace("/api", "")}`);
      }

      // Parser le JSON avec gestion d'erreur améliorée
      let responseData;
      try {
        // Vérifier si c'est vraiment du JSON avant de parser
        if (textResponse.trim().startsWith("<") || textResponse.trim().startsWith("<!DOCTYPE")) {
          console.error(`[HTTP Client] Server returned HTML instead of JSON. Response:`, textResponse.substring(0, 200));
          return err(`Le serveur a retourné du HTML au lieu de JSON. Vérifiez que le backend est démarré sur http://localhost:3000`);
        }
        
        // Vérifier si c'est une erreur Express classique
        if (textResponse.includes("Cannot GET") || textResponse.includes("Cannot POST")) {
          return err(`Route non trouvée: ${url}. Vérifiez que le backend est démarré et que la route existe.`);
        }
        
        responseData = JSON.parse(textResponse);
      } catch (parseError: any) {
        console.error("[HTTP Client] JSON parse error:", parseError);
        console.error("[HTTP Client] Response text:", textResponse.substring(0, 200));
        
        // Si l'erreur contient "Unexpected character: m", c'est probablement du HTML
        if (parseError.message?.includes("Unexpected character: m") || textResponse.includes("<!DOCTYPE")) {
          return err(`Le backend n'est pas démarré ou la route ${url} n'existe pas. Démarrez le backend avec: cd Backend && npm run dev`);
        }
        
        return err(`Impossible de parser la réponse JSON: ${parseError.message}`);
      }
      
      return ok(responseData);
    } catch (error: any) {
      // Gérer les erreurs réseau spécifiques
      if (error.name === "AbortError" || error.message?.includes("timeout")) {
        return err("La requête a expiré. Vérifiez votre connexion.");
      }
      if (error.message?.includes("Network request failed") || error.message?.includes("Network Error")) {
        const baseUrl = API_BASE_URL.replace("/api", "");
        return err(
          `Impossible de se connecter au serveur sur ${baseUrl}.\n\n` +
          `Si vous utilisez un téléphone physique, vérifiez que :\n` +
          `1. Le backend est démarré sur http://localhost:3000\n` +
          `2. Votre téléphone et votre ordinateur sont sur le même réseau Wi-Fi\n` +
          `3. L'IP ${baseUrl.replace("http://", "")} est correcte (voir CONFIGURATION_API.md)\n` +
          `4. Le pare-feu autorise le port 3000`
        );
      }
      return err(error.message || "Erreur réseau");
    }
  }

  /**
   * Effectue une requête POST
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<Result<T>> {
    try {
      // Log pour debug
      console.log(`[HTTP] POST ${url}`, {
        baseURL: API_BASE_URL,
        fullURL: `${API_BASE_URL}${url}`,
        hasData: !!data,
        isFormData: data instanceof FormData,
      });

      // Pour les FormData dans React Native, utiliser une approche spéciale
      if (data instanceof FormData) {
        // Récupérer le token
        const token = await storageService.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
        
        // Utiliser fetch pour les FormData (plus fiable dans React Native)
        const fullUrl = `${API_BASE_URL}${url}`;
        const headers: Record<string, string> = {};
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        // Ne pas définir Content-Type pour FormData - fetch le fera automatiquement
        // Créer un AbortController pour le timeout (plus long pour les uploads)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes pour les uploads
        
        let response: Response;
        try {
          response = await fetch(fullUrl, {
            method: "POST",
            headers,
            body: data,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          
          // Gérer les erreurs spécifiques
          if (fetchError.name === "AbortError") {
            return err("L'upload a pris trop de temps. Vérifiez votre connexion réseau.");
          }
          
          if (fetchError.message?.includes("Network request failed") || fetchError.message?.includes("Network Error")) {
            const baseUrl = API_BASE_URL.replace("/api", "");
            return err(
              `Impossible de se connecter au serveur sur ${baseUrl}.\n\n` +
              `Vérifiez que :\n` +
              `1. Le backend est démarré (cd Backend && npm run dev)\n` +
              `2. Votre téléphone et votre ordinateur sont sur le même réseau Wi-Fi\n` +
              `3. L'IP ${baseUrl.replace("http://", "")} est correcte\n` +
              `4. Le pare-feu Windows autorise le port 3000\n` +
              `5. Le backend écoute sur 0.0.0.0:3000 (pas seulement localhost)`
            );
          }
          
          return err(fetchError.message || "Erreur lors de l'upload");
        }

        if (!response.ok) {
          // Si erreur 401 (Non autorisé), supprimer le token invalide seulement si on en avait un
          if (response.status === 401 && token) {
            console.warn("[HTTP Client] Token invalide ou expiré, suppression du token");
            await storageService.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            await storageService.removeItem(STORAGE_KEYS.USER);
          }
          
          const textResponse = await response.text().catch(() => "");
          const contentType = response.headers.get("content-type");
          
          if (contentType && contentType.includes("application/json")) {
            try {
              const errorData = JSON.parse(textResponse);
              const errorMessage = errorData.message || errorData.error || `Erreur ${response.status}: ${response.statusText}`;
              return err(errorMessage);
            } catch {
              return err(`Erreur ${response.status}: ${response.statusText}`);
            }
          } else {
            return err(`Erreur ${response.status}: ${response.statusText}`);
          }
        }

        const responseData = await response.json();
        console.log(`[HTTP] POST ${url} - Success (fetch)`);
        return ok(responseData);
      }

      // Pour les autres types de données, utiliser fetch pour plus de fiabilité dans React Native
      // Cela garantit que les données JSON sont correctement sérialisées et envoyées
      const token = await storageService.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
      const fullUrl = `${API_BASE_URL}${url}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      // Log avant l'envoi
      const jsonBody = JSON.stringify(data);
      console.log(`[HTTP] POST ${url} - Sending with fetch:`, {
        dataType: typeof data,
        isObject: data && typeof data === "object",
        dataKeys: data && typeof data === "object" ? Object.keys(data) : [],
        jsonBodyLength: jsonBody.length,
        jsonBodyPreview: jsonBody.substring(0, 200),
      });
      
      const response = await fetch(fullUrl, {
        method: "POST",
        headers,
        body: jsonBody,
      });

      const textResponse = await response.text().catch(() => "");
      const contentType = response.headers.get("content-type");
      
      if (!response.ok) {
        // Si erreur 401 (Non autorisé), supprimer le token invalide seulement si on en avait un
        if (response.status === 401 && token) {
          console.warn("[HTTP Client] Token invalide ou expiré, suppression du token");
          await storageService.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          await storageService.removeItem(STORAGE_KEYS.USER);
        }
        
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = JSON.parse(textResponse);
            const errorMessage = errorData.message || errorData.error || `Erreur ${response.status}: ${response.statusText}`;
            return err(errorMessage);
          } catch {
            return err(`Erreur ${response.status}: ${response.statusText}`);
          }
        } else {
          return err(`Erreur ${response.status}: ${response.statusText}`);
        }
      }

      // Vérifier que la réponse est du JSON avant de parser
      if (!contentType || !contentType.includes("application/json")) {
        console.error(`[HTTP Client] Expected JSON but got ${contentType}. Response:`, textResponse.substring(0, 200));
        if (textResponse.includes("Cannot GET") || textResponse.includes("Cannot POST") || textResponse.includes("<!DOCTYPE html>")) {
          return err(`Le backend n'est pas démarré ou la route ${url} n'existe pas. Vérifiez que le serveur tourne sur http://localhost:3000`);
        }
        return err(`Le serveur a retourné une réponse non-JSON (${contentType}). Vérifiez que le backend est démarré et accessible sur ${API_BASE_URL.replace("/api", "")}`);
      }

      let responseData;
      try {
        responseData = JSON.parse(textResponse);
      } catch (parseError: any) {
        console.error("[HTTP Client] JSON parse error:", parseError);
        console.error("[HTTP Client] Response text:", textResponse.substring(0, 200));
        if (parseError.message?.includes("Unexpected character: m") || textResponse.includes("<!DOCTYPE")) {
          return err(`Le backend n'est pas démarré ou la route ${url} n'existe pas. Démarrez le backend avec: cd Backend && npm run dev`);
        }
        return err(`Impossible de parser la réponse JSON: ${parseError.message}`);
      }
      console.log(`[HTTP] POST ${url} - Success (fetch)`);
      return ok(responseData);
    } catch (error: any) {
      // Log détaillé de l'erreur
      console.error(`[HTTP] POST ${url} - Error:`, {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        baseURL: API_BASE_URL,
        fullURL: `${API_BASE_URL}${url}`,
      });

      // Gestion d'erreurs améliorée
      if (error.code === "ECONNREFUSED" || error.message?.includes("Network Error") || error.message?.includes("ERR_NETWORK") || error.message?.includes("Network request failed")) {
        const baseUrl = API_BASE_URL.replace("/api", "");
        return err(
          `Impossible de se connecter au serveur sur ${baseUrl}.\n\n` +
          `Si vous utilisez un téléphone physique, vérifiez que :\n` +
          `1. Le backend est démarré sur http://localhost:3000\n` +
          `2. Votre téléphone et votre ordinateur sont sur le même réseau Wi-Fi\n` +
          `3. L'IP ${baseUrl.replace("http://", "")} est correcte (voir CONFIGURATION_API.md)\n` +
          `4. Le pare-feu autorise le port 3000`
        );
      }
      
      if (error.response) {
        // Erreur avec réponse du serveur
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           `Erreur ${error.response.status}: ${error.response.statusText}`;
        return err(errorMessage);
      }
      
      // Erreur réseau ou autre
      return err(error.message || "Erreur réseau. Vérifiez votre connexion.");
    }
  }

  /**
   * Effectue une requête PUT
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<Result<T>> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return ok(response.data);
    } catch (error: any) {
      return err(error.response?.data?.message || error.message || "Erreur réseau");
    }
  }

  /**
   * Effectue une requête PATCH
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<Result<T>> {
    try {
      const response = await this.client.patch<T>(url, data, config);
      return ok(response.data);
    } catch (error: any) {
      return err(error.response?.data?.message || error.message || "Erreur réseau");
    }
  }

  /**
   * Effectue une requête DELETE
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<Result<T>> {
    try {
      const response = await this.client.delete<T>(url, config);
      return ok(response.data);
    } catch (error: any) {
      return err(error.response?.data?.message || error.message || "Erreur réseau");
    }
  }
}

/**
 * Instance unique du client HTTP
 */
export const httpClient = new HttpClient();

