import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '@/application/services/admin.service';

/**
 * Composant pour la gestion des utilisateurs (Admin)
 */
@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    console.log('👥 AdminUsersComponent.ngOnInit()');
    this.loadUsers();
  }

  /**
   * Charge tous les utilisateurs
   */
  loadUsers(): void {
    this.loading = true;
    this.error = null;
    console.log('🔄 Chargement des utilisateurs via API...');

    this.adminService.getAllUsers().subscribe({
      next: (data: any) => {
        console.log('✅ Utilisateurs reçus:', data);
        // Si data est un objet avec allUsers, utiliser allUsers, sinon utiliser data directement
        this.users = Array.isArray(data?.allUsers) ? data.allUsers : (Array.isArray(data) ? data : []);
        this.loading = false;
      },
      error: (err: Error) => {
        console.error('❌ Erreur utilisateurs:', err);
        this.error = err.message || 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }

  /**
   * Supprime un utilisateur
   */
  deleteUser(userId: string): void {
    if (confirm('Supprimer cet utilisateur ?')) {
      this.loading = true;
      this.adminService.supprimerUtilisateur(userId).subscribe({
        next: () => {
          console.log('✅ Utilisateur supprimé avec succès');
          this.loadUsers(); // Rafraîchir automatiquement
        },
        error: (err: Error) => {
          console.error('❌ Erreur suppression:', err);
          this.error = err.message || 'Erreur lors de la suppression';
          this.loading = false;
        }
      });
    }
  }
}

