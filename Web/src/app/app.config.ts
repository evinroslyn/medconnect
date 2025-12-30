import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi, withXsrfConfiguration } from '@angular/common/http';

import { routes } from './app.routes';
import { ApiInterceptor } from './infrastructure/http/api.interceptor';
import { CacheInterceptor } from './infrastructure/http/cache.interceptor';
import { AppInitService } from './infrastructure/core/app-init.service';

export function initializeApp(appInitService: AppInitService) {
  return () => appInitService.init();
}

// #region agent log
(() => { fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.config.ts:14',message:'Router configuration',data:{routesCount:routes.length,hasDossierRoute:routes.some(r => r.children?.some(c => c.path === 'patients/:patientId/dossiers/:dossierId'))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{}); })();
// #endregion

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // HttpClient avec support pour les intercepteurs DI-based (HTTP_INTERCEPTORS)
    provideHttpClient(
      withInterceptorsFromDi(),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      })
    ),

    // Fournir les intercepteurs HTTP globalement
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CacheInterceptor,
      multi: true
    },

    // Initialisation de l'application
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppInitService],
      multi: true
    }
  ]
};
