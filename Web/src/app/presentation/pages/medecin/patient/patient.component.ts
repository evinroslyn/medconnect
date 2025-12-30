import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PatientService } from '@/application/services/patient.service';
import { PatientWithConnexion } from '@/domain/models';
import { AuthService } from '@/application/services/auth.service';

@Component({
  selector: 'app-medecin-patient',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.scss']
})
export class MedecinPatientComponent implements OnInit {
  patients: PatientWithConnexion[] = [];
  filteredPatients: PatientWithConnexion[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';
  currentUser: any = null;
  userProfile: any = null;
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserProfile();
    this.loadPatients();
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
    if (documentPath.startsWith('http://') || documentPath.startsWith('https://')) {
      return documentPath;
    }
    if (documentPath.startsWith('/uploads/')) {
      return `http://localhost:3000${documentPath}`;
    }
    return `http://localhost:3000/uploads/${documentPath}`;
  }

  loadPatients(): void {
    this.loading = true;
    this.error = null;

    this.patientService.getPatientsWithAccess().subscribe({
      next: (patients: PatientWithConnexion[]) => {
        this.patients = patients;
        this.filteredPatients = patients;
        this.totalItems = patients.length;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message || 'Erreur lors du chargement des patients';
        this.loading = false;
      }
    });
  }

  filterPatients(): void {
    if (!this.searchTerm.trim()) {
      this.filteredPatients = this.patients;
      this.totalItems = this.patients.length;
      this.currentPage = 1;
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredPatients = this.patients.filter(patient =>
      patient.patientNom.toLowerCase().includes(term) ||
      patient.idPatient.toLowerCase().includes(term) ||
      (patient.patientMail && patient.patientMail.toLowerCase().includes(term))
    );
    this.totalItems = this.filteredPatients.length;
    this.currentPage = 1;
  }

  viewPatientProfile(patientId: string): void {
    this.router.navigate(['/medecin/patients', patientId]);
  }

  getPaginatedPatients(): PatientWithConnexion[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredPatients.slice(start, end);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  getStatusClass(status: string): string {
    if (status === 'Accepté' || status === 'Active') {
      return 'bg-status-green/10 text-status-green';
    } else if (status === 'Needs Review') {
      return 'bg-status-yellow/10 text-status-yellow';
    } else {
      return 'bg-status-red/10 text-status-red';
    }
  }

  getStatusLabel(status: string): string {
    if (status === 'Accepté') {
      return 'Active';
    }
    return status;
  }

  getPatientBirthDate(patient: PatientWithConnexion): string {
    if (patient.patientDateNaissance) {
      const birthDate = new Date(patient.patientDateNaissance);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      const formattedDate = birthDate.toISOString().split('T')[0];
      return `${formattedDate} (${actualAge})`;
    }
    return patient.patientMail || '';
  }

  openAddPatientModal(): void {
    // Pour l'instant, afficher un message d'information
    // Cette fonctionnalité nécessitera une modal pour rechercher et ajouter un patient
    // Les patients doivent d'abord s'inscrire et demander une connexion
    const message = 'Pour ajouter un patient, celui-ci doit :\n\n' +
      '1. S\'inscrire sur l\'application mobile\n' +
      '2. Demander une connexion avec vous\n' +
      '3. Vous pourrez alors accepter sa demande depuis cette page\n\n' +
      'Cette fonctionnalité sera bientôt disponible.';
    alert(message);
    // TODO: Implémenter la modal de recherche de patients et gestion des demandes de connexion
  }
}

