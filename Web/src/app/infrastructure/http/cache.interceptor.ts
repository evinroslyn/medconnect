import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache/cache.service';

/**
 * Intercepteur HTTP pour mettre en cache les réponses GET
 */
@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  constructor(private cacheService: CacheService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Ne mettre en cache que les requêtes GET
    if (request.method !== 'GET') {
      // Invalider le cache pour les méthodes non-GET
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH' || request.method === 'DELETE') {
        const url = new URL(request.url);
        this.cacheService.invalidate(url.pathname);
      }
      return next.handle(request);
    }

    // Générer la clé de cache
    const cacheKey = this.cacheService.generateKey(request.url, request.params as any);

    // Vérifier le cache
    const cachedResponse = this.cacheService.get<HttpResponse<any>>(cacheKey);
    if (cachedResponse) {
      console.log(`📦 Réponse récupérée du cache: ${cacheKey}`);
      return of(cachedResponse);
    }

    // Si pas en cache, faire la requête et mettre en cache la réponse
    return next.handle(request).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          // Mettre en cache la réponse
          this.cacheService.set(cacheKey, event, 5 * 60 * 1000); // 5 minutes
        }
      })
    );
  }
}

