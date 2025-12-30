import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PatientService } from '@/application/services/patient.service';
import { DossierMedicalService, FiltresDossier } from '@/application/services/dossier-medical.service';
import { AllergieTraitementService, Allergie, Traitement } from '@/application/services/allergie-traitement.service';
import { Patient, DossierMedical, TypeEnregistrement } from '@/domain/models';
import { NavbarComponent, NavItem } from '@/presentation/components/navbar/navbar.component';

/**
 * Composant pour afficher le profil d'un patient et ses dossiers médicaux
 */
@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.scss']
})
export class PatientProfileComponent implements OnInit {
  patientId: string = '';
  patient: Patient | null = null;
  dossiers: DossierMedical[] = [];
  allergies: Allergie[] = [];
  traitements: Traitement[] = [];
  loading = false;
  error: string | null = null;

  // Filtres
  filtres: FiltresDossier = {};
  searchTerm: string = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  
  typesEnregistrement: TypeEnregistrement[] = [
    'Resultat_Labo',
    'Radio',
    'Ordonnance',
    'Notes',
    'Diagnostic',
    'Imagerie',
    'examen'
  ];

  navItems: NavItem[] = [
    { label: 'Dashboard', path: '/medecin/dashboard' },
    { label: 'Patients', path: '/medecin/dashboard' },
    { label: 'Messages', path: '/medecin/chat' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private dossierService: DossierMedicalService,
    private allergieTraitementService: AllergieTraitementService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.patientId = params['id'];
      if (this.patientId) {
        this.loadPatientProfile();
        this.loadDossiers();
        this.loadAllergies();
        this.loadTraitements();
      }
    });
  }

  /**
   * Charge le profil du patient
   */
  loadPatientProfile(): void {
    this.loading = true;
    this.patientService.getPatientProfile(this.patientId).subscribe({
      next: (patient: Patient) => {
        this.patient = patient;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message || 'Erreur lors du chargement du profil';
        this.loading = false;
      }
    });
  }

  /**
   * Charge les dossiers médicaux du patient
   */
  loadDossiers(): void {
    this.loading = true;
    this.dossierService.getDossiersByPatient(this.patientId, this.filtres).subscribe({
      next: (dossiers: DossierMedical[]) => {
        // Filtrer par terme de recherche si présent
        if (this.searchTerm && this.searchTerm.trim()) {
          const term = this.searchTerm.toLowerCase().trim();
          this.dossiers = dossiers.filter((d: DossierMedical) =>
            d.titre.toLowerCase().includes(term) ||
            (d.description && d.description.toLowerCase().includes(term)) ||
            (d.type && d.type.toLowerCase().includes(term))
          );
        } else {
          this.dossiers = dossiers;
        }
        this.totalItems = this.dossiers.length;
        this.currentPage = 1;
        this.loading = false;
      },
      error: (err: Error) => {
        // Message d'erreur plus explicite pour les erreurs de connexion
        let errorMessage = err.message || 'Erreur lors du chargement des dossiers';
        
        if (errorMessage.includes('connexion au serveur') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
          errorMessage = 'Impossible de se connecter au serveur backend. Veuillez vérifier que le serveur est démarré sur le port 3000.';
        }
        
        this.error = errorMessage;
        this.loading = false;
        console.error('[PatientProfileComponent] Erreur lors du chargement des dossiers:', err);
      }
    });
  }

  /**
   * Applique les filtres
   */
  applyFilters(): void {
    this.currentPage = 1;
    this.loadDossiers();
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.filtres = {};
    this.loadDossiers();
  }

  /**
   * Pagination
   */
  getPaginatedDossiers(): DossierMedical[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.dossiers.slice(start, end);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  /**
   * Charge les allergies du patient
   */
  loadAllergies(): void {
    this.allergieTraitementService.getAllergies(this.patientId).subscribe({
      next: (allergies: Allergie[]) => {
        this.allergies = allergies;
      },
      error: (err: Error) => {
        console.error('Erreur lors du chargement des allergies:', err);
      }
    });
  }

  /**
   * Charge les traitements du patient
   */
  loadTraitements(): void {
    this.allergieTraitementService.getTraitements(this.patientId).subscribe({
      next: (traitements: Traitement[]) => {
        this.traitements = traitements;
      },
      error: (err: Error) => {
        console.error('Erreur lors du chargement des traitements:', err);
      }
    });
  }


  /**
   * Affiche les détails d'un dossier
   */
  viewDossier(dossierId: string): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'patient-profile.component.ts:133',message:'viewDossier called',data:{patientId:this.patientId,dossierId,fullPath:`/medecin/patients/${this.patientId}/dossiers/${dossierId}`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    this.router.navigate(['/medecin/patients', this.patientId, 'dossiers', dossierId]);
  }
}

