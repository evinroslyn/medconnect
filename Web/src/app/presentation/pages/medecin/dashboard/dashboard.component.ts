import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PatientService } from '@/application/services/patient.service';
import { AuthService } from '@/application/services/auth.service';
import { PatientWithConnexion } from '@/domain/models';

/**
 * Composant Dashboard pour les médecins
 * Affiche la liste des patients qui ont accordé l'accès
 */
@Component({
  selector: 'app-medecin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class MedecinDashboardComponent implements OnInit {
  patients: PatientWithConnexion[] = [];
  filteredPatients: PatientWithConnexion[] = [];
  pendingRequests: any[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';
  currentUser: any = null;
  userProfile: any = null;
  
  // Pagination pour les demandes en attente
  currentPageRequests = 1;
  itemsPerPageRequests = 10;
  
  // Pagination pour les patients récents
  currentPagePatients = 1;
  itemsPerPagePatients = 10;

  constructor(
    private patientService: PatientService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserProfile();
    this.loadPatients();
    this.loadPendingRequests();
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
   * Charge la liste des patients
   */
  loadPatients(): void {
    this.loading = true;
    this.error = null;

    this.patientService.getPatientsWithAccess().subscribe({
      next: (patients: PatientWithConnexion[]) => {
        this.patients = patients;
        this.filteredPatients = patients;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message || 'Erreur lors du chargement des patients';
        this.loading = false;
      }
    });
  }

  /**
   * Charge les demandes de connexion en attente
   */
  loadPendingRequests(): void {
    this.patientService.getPendingRequests().subscribe({
      next: (requests: any[]) => {
        this.pendingRequests = requests || [];
      },
      error: (err: Error) => {
        console.error('Erreur lors du chargement des demandes:', err);
        this.pendingRequests = [];
      }
    });
  }

  /**
   * Accepte une demande de connexion
   */
  acceptRequest(connexionId: string): void {
    this.error = null; // Réinitialiser l'erreur
    this.patientService.acceptConnexionRequest(connexionId).subscribe({
      next: (response) => {
        // Vérifier si la réponse indique un succès
        if (response && response.success !== false) {
          // Recharger les listes après acceptation
          this.loadPatients();
          this.loadPendingRequests();
        } else {
          // Si success: false, afficher le message d'erreur
          this.error = response?.message || response?.error || 'Erreur lors de l\'acceptation de la demande';
        }
      },
      error: (err: Error) => {
        console.error('Erreur lors de l\'acceptation:', err);
        this.error = err.message || 'Erreur lors de l\'acceptation de la demande';
      }
    });
  }

  /**
   * Rejette une demande de connexion
   */
  rejectRequest(connexionId: string): void {
    this.error = null; // Réinitialiser l'erreur
    this.patientService.rejectConnexionRequest(connexionId).subscribe({
      next: (response) => {
        // Vérifier si la réponse indique un succès
        if (response && response.success !== false) {
          // Recharger les listes après rejet
          this.loadPendingRequests();
        } else {
          // Si success: false, afficher le message d'erreur
          this.error = response?.message || response?.error || 'Erreur lors du rejet de la demande';
        }
      },
      error: (err: Error) => {
        console.error('Erreur lors du rejet:', err);
        this.error = err.message || 'Erreur lors du rejet de la demande';
      }
    });
  }

  /**
   * Filtre les patients selon le terme de recherche
   */
  filterPatients(): void {
    if (!this.searchTerm.trim()) {
      this.filteredPatients = this.patients;
      this.currentPagePatients = 1;
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredPatients = this.patients.filter(patient =>
      patient.patientNom.toLowerCase().includes(term) ||
      patient.idPatient.toLowerCase().includes(term) ||
      (patient.patientMail && patient.patientMail.toLowerCase().includes(term))
    );
    this.currentPagePatients = 1;
  }

  /**
   * Navigue vers le profil d'un patient
   */
  viewPatientProfile(patientId: string): void {
    this.router.navigate(['/medecin/patients', patientId]);
  }

  /**
   * Navigue vers la page des patients
   */
  navigateToPatients(): void {
    this.router.navigate(['/medecin/patients']);
  }

  /**
   * Compte les patients actifs
   */
  getActivePatientsCount(): number {
    return this.filteredPatients.filter(p => p.statutConnexion === 'Accepté').length;
  }

  /**
   * Compte les visites récentes (derniers 30 jours)
   */
  getRecentVisitsCount(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.filteredPatients.filter(p => {
      if (!p.dateAcceptation) return false;
      const visitDate = new Date(p.dateAcceptation);
      return visitDate >= thirtyDaysAgo;
    }).length;
  }

  /**
   * Pagination pour les demandes en attente
   */
  getPaginatedRequests(): any[] {
    const start = (this.currentPageRequests - 1) * this.itemsPerPageRequests;
    const end = start + this.itemsPerPageRequests;
    return this.pendingRequests.slice(start, end);
  }

  getTotalPagesRequests(): number {
    return Math.ceil(this.pendingRequests.length / this.itemsPerPageRequests);
  }

  goToPageRequests(page: number): void {
    if (page >= 1 && page <= this.getTotalPagesRequests()) {
      this.currentPageRequests = page;
    }
  }

  /**
   * Pagination pour les patients récents
   */
  getPaginatedPatients(): PatientWithConnexion[] {
    const start = (this.currentPagePatients - 1) * this.itemsPerPagePatients;
    const end = start + this.itemsPerPagePatients;
    return this.filteredPatients.slice(start, end);
  }

  getTotalPagesPatients(): number {
    return Math.ceil(this.filteredPatients.length / this.itemsPerPagePatients);
  }

  goToPagePatients(page: number): void {
    if (page >= 1 && page <= this.getTotalPagesPatients()) {
      this.currentPagePatients = page;
    }
  }

  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
  }
}

