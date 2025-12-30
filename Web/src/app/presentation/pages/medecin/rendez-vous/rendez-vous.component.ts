import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RendezVousService } from '@/application/services/rendez-vous.service';
import { AuthService } from '@/application/services/auth.service';
import { Disponibilite, RendezVous } from '@/domain/models';

@Component({
  selector: 'app-medecin-rendez-vous',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './rendez-vous.component.html',
  styleUrls: ['./rendez-vous.component.scss']
})
export class MedecinRendezVousComponent implements OnInit {
  disponibilites: Disponibilite[] = [];
  rendezVous: RendezVous[] = [];
  disponibiliteForm: FormGroup;
  loading = false;
  loadingRendezVous = false;
  error: string | null = null;
  showForm = false;
  currentUser: any = null;
  userProfile: any = null;

  constructor(
    private rendezVousService: RendezVousService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.disponibiliteForm = this.fb.group({
      jour: ['', Validators.required],
      heureDebut: ['', Validators.required],
      heureFin: ['', Validators.required],
      lieu: [''],
      centreMedical: [''],
      typeConsultation: ['Présentiel', Validators.required],
      actif: [true]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserProfile();
    this.loadDisponibilites();
    this.loadRendezVous();
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

  loadDisponibilites(): void {
    this.loading = true;
    this.error = null; // Réinitialiser l'erreur
    this.rendezVousService.getDisponibilites().subscribe({
      next: (disponibilites) => {
        this.disponibilites = disponibilites || [];
        this.loading = false;
      },
      error: (err) => {
        // Ne pas afficher d'erreur si c'est juste un 404 (endpoint non implémenté)
        if (err.status !== 404) {
          this.error = err.message || 'Erreur lors du chargement des disponibilités';
        } else {
          // Si 404, initialiser avec un tableau vide
          this.disponibilites = [];
        }
        this.loading = false;
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.disponibiliteForm.reset({
        typeConsultation: 'Présentiel',
        actif: true
      });
    }
  }

  onSubmit(): void {
    if (this.disponibiliteForm.invalid) {
      return;
    }

    this.loading = true;
    const formValue = this.disponibiliteForm.value;
    const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    const disponibilite: Omit<Disponibilite, 'id'> = {
      idMedecin: currentUser.id,
      jour: formValue.jour,
      heureDebut: formValue.heureDebut,
      heureFin: formValue.heureFin,
      lieu: formValue.lieu || undefined,
      centreMedical: formValue.centreMedical || undefined,
      typeConsultation: formValue.typeConsultation,
      actif: formValue.actif
    };

    this.rendezVousService.createDisponibilite(disponibilite).subscribe({
      next: () => {
        this.loadDisponibilites();
        this.toggleForm();
        this.error = null;
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors de la création de la disponibilité';
        this.loading = false;
      }
    });
  }

  toggleDisponibilite(disponibilite: Disponibilite): void {
    if (!disponibilite.id) return;
    
    this.rendezVousService.updateDisponibilite(disponibilite.id, {
      actif: !disponibilite.actif
    }).subscribe({
      next: () => {
        this.loadDisponibilites();
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors de la mise à jour';
      }
    });
  }

  deleteDisponibilite(id: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) {
      return;
    }

    this.rendezVousService.deleteDisponibilite(id).subscribe({
      next: () => {
        this.loadDisponibilites();
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors de la suppression';
      }
    });
  }

  /**
   * Charge les rendez-vous du médecin
   */
  loadRendezVous(): void {
    this.loadingRendezVous = true;
    this.rendezVousService.getRendezVous().subscribe({
      next: (response: any) => {
        // Si la réponse est un objet avec data
        if (response && response.data) {
          this.rendezVous = response.data || [];
        } else if (Array.isArray(response)) {
          this.rendezVous = response;
        } else {
          this.rendezVous = [];
        }
        this.loadingRendezVous = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des rendez-vous:', err);
        this.rendezVous = [];
        this.loadingRendezVous = false;
      }
    });
  }

  /**
   * Annule un rendez-vous
   */
  annulerRendezVous(rendezVousId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      return;
    }

    this.rendezVousService.annulerRendezVous(rendezVousId).subscribe({
      next: () => {
        this.loadRendezVous();
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors de l\'annulation';
      }
    });
  }

  /**
   * Formate une date pour l'affichage
   */
  formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getJourLabel(jour: string): string {
    const date = new Date(jour);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  }
}

