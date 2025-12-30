import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '@/application/services/auth.service';

/**
 * Layout pour les pages d'administration avec sidebar
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  currentRoute: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
  }

  /**
   * Vérifie si une route est active
   */
  isActiveRoute(route: string): boolean {
    return this.currentRoute.includes(route);
  }

  /**
   * Déconnexion
   */
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

