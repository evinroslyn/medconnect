import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '@/application/services/auth.service';

export interface NavItem {
  label: string;
  path: string;
  active?: boolean;
}

/**
 * Composant de barre de navigation réutilisable
 * Standardise l'apparence du header sur toutes les pages
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Input() title: string = 'MedConnect';
  @Input() subtitle?: string;
  @Input() icon: string = 'shield_lock';
  @Input() navItems: NavItem[] = [];
  @Input() showLogout: boolean = true;

  currentUser: any = null;
  userProfile: any = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserProfile();
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

  /**
   * Vérifie si un lien de navigation est actif
   */
  isActive(path: string): boolean {
    return this.router.url.includes(path);
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
        this.router.navigate(['/login']);
      }
    });
  }
}
