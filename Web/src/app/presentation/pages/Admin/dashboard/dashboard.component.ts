import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AdminService } from '@/application/services/admin.service';
import { AuthService } from '@/application/services/auth.service';
import { filter, Subscription } from 'rxjs';

/**
 * Composant Dashboard pour l'administrateur
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  statistics: any = null;
  loading = false;
  error: string | null = null;
  private routerSubscription?: Subscription;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🚀 AdminDashboardComponent.ngOnInit() called');

    // Vérifier immédiatement que le token est présent avant de charger les statistiques
    const token = localStorage.getItem('auth_token');

    console.log('📍 Dashboard - Vérification du token:');
    console.log('   localStorage.getItem("auth_token"):', token ? token.substring(0, 30) + '...' : 'NULL');
    console.log('   authService.getToken():', this.authService.getToken() ? this.authService.getToken()?.substring(0, 30) + '...' : 'NULL');

    if (!token) {
      console.error('❌ CRITIQUE: Token MANQUANT dans le dashboard!');
      this.error = 'Session expirée. Veuillez vous reconnecter.';
      return;
    }

    console.log('✅ Token présent, chargement des statistiques...');
    this.loadStatistics();

    // Écouter les événements de navigation pour rafraîchir les stats quand on revient au dashboard
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url === '/admin/dashboard' || event.urlAfterRedirects === '/admin/dashboard') {
          console.log('🔄 Retour au dashboard, rafraîchissement des statistiques...');
          this.loadStatistics();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  /**
   * Charge les statistiques
   */
  loadStatistics(): void {
    this.loading = true;
    console.log('📊 Appel à adminService.getStatistics()...');

    this.adminService.getStatistics().subscribe({
      next: (stats: any) => {
        console.log('✅ Statistiques reçues:', stats);
        this.statistics = stats;
        this.loading = false;
      },
      error: (err: Error) => {
        console.error('❌ Erreur lors du chargement des statistiques:', err);
        this.error = err.message || 'Erreur lors du chargement des statistiques';
        this.loading = false;
      }
    });
  }
}


