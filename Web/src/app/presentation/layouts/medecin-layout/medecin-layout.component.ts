import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthService } from '@/application/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-medecin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './medecin-layout.component.html',
  styleUrls: ['./medecin-layout.component.scss']
})
export class MedecinLayoutComponent implements OnInit {
  currentUser: any = null;
  userProfile: any = null;
  currentRoute: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserProfile();

    // Écouter les changements de route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateCurrentRoute();
      });

    this.updateCurrentRoute();
  }

  /**
   * Charge le profil complet de l'utilisateur pour obtenir photoProfil
   */
  loadUserProfile(): void {
    this.authService.getProfile().subscribe({
      next: (response: any) => {
        if (response.success && response.user) {
          this.userProfile = response.user;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement du profil:', error);
      }
    });
  }

  /**
   * Obtient l'URL complète d'un document
   */
  getDocumentUrl(documentPath: string | undefined): string {
    if (!documentPath) {
      return '';
    }
    // Si c'est déjà une URL complète, la retourner telle quelle
    if (documentPath.startsWith('http://') || documentPath.startsWith('https://')) {
      return documentPath;
    }
    // Si c'est un chemin qui commence par /uploads, l'utiliser tel quel
    if (documentPath.startsWith('/uploads/')) {
      return `http://localhost:3000${documentPath}`;
    }
    // Sinon, c'est probablement juste le filename, donc on ajoute /uploads/
    return `http://localhost:3000/uploads/${documentPath}`;
  }

  updateCurrentRoute(): void {
    const url = this.router.url;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'medecin-layout.component.ts:37',message:'Route update in layout',data:{url,includesDossiers:url.includes('/dossiers')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (url.includes('/dashboard') || url === '/medecin' || url === '/medecin/') {
      this.currentRoute = 'dashboard';
    } else if (url.includes('/patients') && !url.includes('/patients/')) {
      this.currentRoute = 'patients';
    } else if (url.includes('/chat')) {
      this.currentRoute = 'messages';
    } else if (url.includes('/rendez-vous')) {
      this.currentRoute = 'rendez-vous';
    } else if (url.includes('/profile')) {
      this.currentRoute = 'profile';
    } else {
      this.currentRoute = '';
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([`/medecin/${route}`]);
  }

  isActive(route: string): boolean {
    return this.currentRoute === route;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Même en cas d'erreur, rediriger vers login
        this.router.navigate(['/login']);
      }
    });
  }
}

