import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

/**
 * Interface pour les entrées de cache
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Configuration du cache
 */
interface CacheConfig {
  ttl?: number; // Time to live en millisecondes
  key?: string; // Clé personnalisée
}

/**
 * Service de cache pour optimiser les appels API
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes par défaut

  /**
   * Récupérer une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée a expiré
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Mettre une valeur en cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt
    });
    console.log(`💾 Données mises en cache: ${key} (expire dans ${(ttl || this.defaultTTL) / 1000}s)`);
  }

  /**
   * Supprimer une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Entrée supprimée du cache: ${key}`);
  }

  /**
   * Vider tout le cache
   */
  clear(): void {
    this.cache.clear();
    console.log('🗑️ Cache vidé');
  }

  /**
   * Vérifier si une clé existe dans le cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Vérifier si l'entrée a expiré
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Nettoyer les entrées expirées
   */
  cleanExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} entrée(s) expirée(s) supprimée(s) du cache`);
    }
  }

  /**
   * Wrapper pour mettre en cache le résultat d'un Observable
   */
  cacheObservable<T>(
    key: string,
    observable: Observable<T>,
    config?: CacheConfig
  ): Observable<T> {
    // Vérifier le cache d'abord
    const cached = this.get<T>(key);
    if (cached !== null) {
      console.log(`📦 Données récupérées du cache: ${key}`);
      return of(cached);
    }

    // Si pas en cache, exécuter l'observable et mettre en cache le résultat
    const cacheKey = config?.key || key;
    const ttl = config?.ttl;

    return observable.pipe(
      tap(data => {
        this.set(cacheKey, data, ttl);
      }),
      catchError(error => {
        console.error(`❌ Erreur lors de la récupération des données pour ${key}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Invalider le cache pour une clé spécifique ou un pattern
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.clear();
      return;
    }

    let invalidated = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    if (invalidated > 0) {
      console.log(`🗑️ ${invalidated} entrée(s) invalidée(s) pour le pattern: ${pattern}`);
    }
  }

  /**
   * Obtenir des statistiques sur le cache
   */
  getStats(): {
    size: number;
    keys: string[];
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const keys = Array.from(this.cache.keys());
    const entries = Array.from(this.cache.values());

    return {
      size: this.cache.size,
      keys,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : null
    };
  }

  /**
   * Générer une clé de cache à partir d'un endpoint et de paramètres
   */
  generateKey(endpoint: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return endpoint;
    }

    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');

    return `${endpoint}?${sortedParams}`;
  }
}

