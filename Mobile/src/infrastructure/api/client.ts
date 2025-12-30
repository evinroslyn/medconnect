import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Configuration de l'API
 * Utilise la même logique que httpClient.ts pour la cohérence
 */
import { Platform } from "react-native";

const getApiBaseUrl = () => {
  // Priorité à la variable d'environnement
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Pour Android Emulator
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000/api";
  }
  
  // Pour iOS Simulator ou par défaut
  return "http://localhost:3000/api";
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Classe pour gérer les appels API
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    // Intercepteur pour ajouter le token JWT aux requêtes
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem("auth_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les erreurs de réponse
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expiré ou invalide, déconnecter l'utilisateur
          await AsyncStorage.removeItem("auth_token");
          await AsyncStorage.removeItem("user");
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Effectue une requête GET
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * Effectue une requête POST
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Effectue une requête PUT
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Effectue une requête PATCH
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Effectue une requête DELETE
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

/**
 * Instance unique du client API
 */
export const apiClient = new ApiClient();

