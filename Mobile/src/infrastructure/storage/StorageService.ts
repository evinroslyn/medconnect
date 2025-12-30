import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Service de stockage local
 * Gère le stockage persistant des données (token, préférences, etc.)
 */
export class StorageService {
  /**
   * Stocke une valeur
   * @param key - Clé de stockage
   * @param value - Valeur à stocker
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  }

  /**
   * Récupère une valeur
   * @param key - Clé de stockage
   * @returns Valeur stockée ou null
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue == null) {
        return null;
      }
      // Essayer de parser en JSON
      try {
        return JSON.parse(jsonValue) as T;
      } catch (parseError) {
        // Si le parsing échoue, c'est peut-être une string simple (comme un token)
        // Retourner la valeur brute
        return jsonValue as T;
      }
    } catch (error) {
      console.error(`[StorageService] Error getting item ${key}:`, error);
      return null;
    }
  }

  /**
   * Supprime une valeur
   * @param key - Clé de stockage
   */
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  /**
   * Supprime toutes les valeurs
   */
  async clear(): Promise<void> {
    await AsyncStorage.clear();
  }

  /**
   * Récupère toutes les clés
   * @returns Liste des clés
   */
  async getAllKeys(): Promise<readonly string[]> {
    return await AsyncStorage.getAllKeys();
  }
}

/**
 * Instance unique du service de stockage
 */
export const storageService = new StorageService();

