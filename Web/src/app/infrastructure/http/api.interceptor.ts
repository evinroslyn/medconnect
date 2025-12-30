import { Injectable } from "@angular/core";
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from "@angular/common/http";
import { Observable } from "rxjs";

/**
 * Intercepteur HTTP pour ajouter le token JWT aux requêtes
 * Cet intercepteur est enregistré dans app.config.ts via HTTP_INTERCEPTORS
 * et s'applique automatiquement à toutes les requêtes HTTP
 *
 * IMPORTANT: Ne pas injecter AuthService pour éviter une dépendance circulaire
 * (AuthService utilise HttpClient qui utilise cet intercepteur)
 */
@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  // Pas de dépendances injectées pour éviter les dépendances circulaires
  constructor() {
    console.log('🔧 ApiInterceptor initialisé');
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Récupérer le token directement depuis localStorage
    const token = localStorage.getItem('auth_token');

    // Logging détaillé pour chaque requête
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 ApiInterceptor.intercept()');
    console.log('  URL:', request.url);
    console.log('  Method:', request.method);
    console.log('  Token dans localStorage:', !!token);
    if (token) {
      console.log('  Token (preview):', token.substring(0, 30) + '...');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Ajouter le token d'authentification si disponible
    if (token) {
      const modifiedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✅ Token AJOUTÉ au header Authorization');
      console.log('   Header value:', modifiedRequest.headers.get('Authorization')?.substring(0, 30) + '...');
      return next.handle(modifiedRequest);
    }

    // Si pas de token, vérifier que c'est une route publique
    const isPublicRoute = request.url.includes('/auth/login') ||
                         request.url.includes('/auth/register') ||
                         request.url.includes('/auth/logout') ||
                         request.url.includes('/auth/');

    if (!isPublicRoute) {
      console.warn('⚠️ ⚠️ ⚠️ ATTENTION: Token MANQUANT pour requête PROTÉGÉE');
      console.warn('  URL:', request.url);
      console.warn('  localStorage.getItem("auth_token"):', localStorage.getItem('auth_token'));
    }

    return next.handle(request);
  }
}
