import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AdminService } from '@/application/services/admin.service';
import { Medecin } from '@/domain/models';

/**
 * Composant pour la vérification des médecins
 */
@Component({
  selector: 'app-admin-verification',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.scss']
})
export class AdminVerificationComponent implements OnInit {
  medecinsEnAttente: Medecin[] = [];
  medecinsValides: Medecin[] = [];
  medecinsRejetes: Medecin[] = [];
  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';
  loading = false;
  error: string | null = null;
  searchTerm: string = '';
  selectedMedecin: Medecin | null = null;
  showDocumentsModal = false;
  showRejectModal = false;
  rejectMotif: string = '';

  constructor(
    private adminService: AdminService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadAllMedecins();
  }

  /**
   * Charge tous les médecins (en attente, validés, rejetés)
   */
  loadAllMedecins(): void {
    this.loading = true;
    this.error = null;

    // Charger les médecins en attente
    this.adminService.getMedecinsEnAttente().subscribe({
      next: (medecins: Medecin[]) => {
        console.log('✅ Médecins en attente:', medecins.length);
        this.medecinsEnAttente = medecins;
        this.loading = false;
      },
      error: (err: Error) => {
        console.error('❌ Erreur médecins en attente:', err);
        this.error = err.message || 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }

  /**
   * Valide un médecin
   */
  validerMedecin(medecinId: string): void {
    if (confirm('Êtes-vous sûr de valider ce médecin ?')) {
      this.loading = true;
      console.log('✔️ Validation du médecin:', medecinId);

      this.adminService.validerMedecin(medecinId).subscribe({
        next: () => {
          console.log('✅ Médecin validé avec succès');
          this.loadAllMedecins();
        },
        error: (err: Error) => {
          console.error('❌ Erreur validation:', err);
          this.error = err.message || 'Erreur lors de la validation';
          this.loading = false;
        }
      });
    }
  }

  /**
   * Ouvre le modal de rejet
   */
  openRejectModal(medecin: Medecin): void {
    this.selectedMedecin = medecin;
    this.rejectMotif = '';
    this.showRejectModal = true;
  }

  /**
   * Ferme le modal de rejet
   */
  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedMedecin = null;
    this.rejectMotif = '';
  }

  /**
   * Rejette un médecin avec motif
   */
  confirmReject(): void {
    if (!this.selectedMedecin) return;

    if (!this.rejectMotif.trim()) {
      this.error = 'Veuillez entrer un motif de rejet';
      return;
    }

    this.loading = true;
    console.log('❌ Rejet du médecin:', this.selectedMedecin.id, 'Motif:', this.rejectMotif);

    this.adminService.rejeterMedecin(this.selectedMedecin.id, this.rejectMotif).subscribe({
      next: () => {
        console.log('✅ Médecin rejeté avec succès');
        this.closeRejectModal();
        this.loadAllMedecins();
      },
      error: (err: Error) => {
        console.error('❌ Erreur rejet:', err);
        this.error = err.message || 'Erreur lors du rejet';
        this.loading = false;
      }
    });
  }

  /**
   * Change l'onglet actif
   */
  setActiveTab(tab: 'pending' | 'approved' | 'rejected'): void {
    this.activeTab = tab;
  }

  /**
   * Obtient les médecins à afficher selon l'onglet actif
   */
  getMedecinsToDisplay(): Medecin[] {
    let medecins: Medecin[] = [];
    switch (this.activeTab) {
      case 'pending':
        medecins = this.medecinsEnAttente;
        break;
      case 'approved':
        medecins = this.medecinsValides;
        break;
      case 'rejected':
        medecins = this.medecinsRejetes;
        break;
      default:
        medecins = [];
    }

    // Filtrer par terme de recherche si présent
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      return medecins.filter(m =>
        m.nom.toLowerCase().includes(term) ||
        m.specialite.toLowerCase().includes(term) ||
        m.numeroLicence.toLowerCase().includes(term)
      );
    }

    return medecins;
  }

  /**
   * Obtient le nombre de médecins en attente
   */
  getPendingCount(): number {
    return this.medecinsEnAttente.length;
  }

  /**
   * Obtient le nombre de médecins validés
   */
  getApprovedCount(): number {
    return this.medecinsValides.length;
  }

  /**
   * Obtient le nombre de médecins rejetés
   */
  getRejectedCount(): number {
    return this.medecinsRejetes.length;
  }

  /**
   * Affiche les documents d'un médecin
   */
  viewDocuments(medecin: Medecin): void {
    console.log('📄 Affichage des documents pour:', medecin.nom);
    this.selectedMedecin = medecin;
    this.showDocumentsModal = true;
  }

  /**
   * Ferme la modal de documents
   */
  closeDocumentsModal(): void {
    this.showDocumentsModal = false;
    this.selectedMedecin = null;
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
   * Obtient une URL sécurisée pour l'iframe
   */
  getSafeDocumentUrl(documentPath: string | undefined): SafeResourceUrl {
    const url = this.getDocumentUrl(documentPath);
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Gère les erreurs d'affichage de document
   */
  handleDocumentError(event: any): void {
    console.error('❌ Erreur lors de l\'affichage du document:', event);
    // L'iframe affichera une page vierge en cas d'erreur, mais le lien de téléchargement fonctionnera toujours
  }
}
