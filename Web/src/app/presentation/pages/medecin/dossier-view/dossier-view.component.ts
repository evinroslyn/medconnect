import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DossierMedicalService } from '@/application/services/dossier-medical.service';
import { DocumentMedicalService } from '@/application/services/document-medical.service';
import { CommentaireService, Commentaire, CreateCommentaireData } from '@/application/services/commentaire.service';
import { DossierMedical, DocumentMedical } from '@/domain/models';
import { NavbarComponent, NavItem } from '@/presentation/components/navbar/navbar.component';
import { API_CONFIG } from '@/infrastructure/config/api.config';

@Component({
  selector: 'app-dossier-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, HttpClientModule],
  templateUrl: './dossier-view.component.html',
  styleUrls: ['./dossier-view.component.scss']
})
export class DossierViewComponent implements OnInit {
  dossier: DossierMedical | null = null;
  documents: DocumentMedical[] = [];
  patientId: string = '';
  dossierId: string = '';
  loading = true;
  error: string | null = null;
  permissions: { hasAccess: boolean; peutTelecharger: boolean; peutScreenshot: boolean } = {
    hasAccess: false,
    peutTelecharger: false,
    peutScreenshot: false
  };
  
  // Gestion des commentaires
  documentComments: Map<string, Commentaire[]> = new Map();
  showCommentsModal: boolean = false;
  selectedDocumentForComment: DocumentMedical | null = null;
  newCommentText: string = '';
  loadingComments: boolean = false;
  addingComment: boolean = false;

  navItems: NavItem[] = [
    { label: 'Dashboard', path: '/medecin/dashboard' },
    { label: 'Patients', path: '/medecin/patients' },
    { label: 'Messages', path: '/medecin/chat' },
    { label: 'Rendez-vous', path: '/medecin/rendez-vous' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dossierService: DossierMedicalService,
    private documentService: DocumentMedicalService,
    private commentaireService: CommentaireService,
    private http: HttpClient
  ) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dossier-view.component.ts:43',message:'DossierViewComponent constructor called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  }

  ngOnInit(): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dossier-view.component.ts:46',message:'DossierViewComponent ngOnInit called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    this.route.params.subscribe(params => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dossier-view.component.ts:49',message:'Route params received',data:{patientId:params['patientId'],dossierId:params['dossierId'],allParams:params},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      this.patientId = params['patientId'];
      this.dossierId = params['dossierId'];
      this.loadDossier();
    });
  }

  /**
   * Charge le dossier médical et ses documents
   */
  loadDossier(): void {
    this.loading = true;
    this.error = null;

    // Vérifier les permissions d'accès
    this.dossierService.verifierAccesDossier(this.dossierId).subscribe({
      next: (perms) => {
        this.permissions = perms;

        if (!perms.hasAccess) {
          this.error = "Vous n'avez pas accès à ce dossier médical";
          this.loading = false;
          return;
        }

        // Charger le dossier
        this.dossierService.getDossierById(this.dossierId).subscribe({
          next: (dossier) => {
            this.dossier = dossier;
            this.loadDocuments();
            this.loadDossierComments();
          },
          error: (err) => {
            this.error = err.message || 'Erreur lors du chargement du dossier';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors de la vérification des permissions';
        this.loading = false;
      }
    });
  }

  /**
   * Charge les documents du dossier
   */
  loadDocuments(): void {
    this.documentService.getDocumentsByDossier(this.dossierId).subscribe({
      next: (documents) => {
        this.documents = documents;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors du chargement des documents';
        this.loading = false;
      }
    });
  }

  /**
   * Visualise un document (sans téléchargement si non autorisé)
   */
  viewDocument(document: DocumentMedical): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dossier-view.component.ts:120',message:'viewDocument called',data:{documentId:document.id,hasCheminFichier:!!document.cheminFichier},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    if (!document.cheminFichier) {
      alert('Aucun fichier associé à ce document');
      return;
    }

    // Toujours utiliser l'endpoint /view pour la visualisation sécurisée
    // Cet endpoint permet la visualisation même sans permission de téléchargement
    const viewUrl = `${API_CONFIG.BASE_URL}/documents-medicaux/${document.id}/view`;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dossier-view.component.ts:128',message:'HTTP request about to be sent',data:{viewUrl,baseUrl:API_CONFIG.BASE_URL,documentId:document.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    // Utiliser HttpClient pour récupérer le document avec le token (géré automatiquement par l'interceptor)
    this.http.get(viewUrl, {
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        // Créer une URL blob pour la visualisation
        const blob = response.body;
        if (!blob) {
          alert('Erreur: Document vide');
          return;
        }

        const url = window.URL.createObjectURL(blob);

        // Ouvrir dans un nouvel onglet
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

        if (!newWindow) {
          alert('Veuillez autoriser les popups pour visualiser le document');
          window.URL.revokeObjectURL(url);
        } else {
          // Nettoyer l'URL blob après un délai
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);
        }
      },
      error: (err) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dossier-view.component.ts:158',message:'HTTP request error',data:{status:err.status,statusText:err.statusText,url:err.url,message:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        console.error('Erreur lors de la visualisation:', err);
        let errorMessage = 'Erreur lors de l\'ouverture du document';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        alert(errorMessage);
      }
    });
  }

  /**
   * Retourne au profil du patient
   */
  goBack(): void {
    this.router.navigate(['/medecin/patients', this.patientId]);
  }

  /**
   * Vérifie si un document est une image
   */
  isImage(document: DocumentMedical): boolean {
    if (!document.cheminFichier) return false;
    const ext = document.cheminFichier.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  }

  /**
   * Vérifie si un document est un PDF
   */
  isPdf(document: DocumentMedical): boolean {
    if (!document.cheminFichier) return false;
    return document.cheminFichier.toLowerCase().endsWith('.pdf');
  }

  /**
   * Charge les commentaires du dossier
   */
  loadDossierComments(): void {
    this.commentaireService.getCommentairesByDossier(this.dossierId).subscribe({
      next: (commentaires) => {
        // Les commentaires du dossier sont stockés avec la clé 'dossier'
        this.documentComments.set('dossier', commentaires);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des commentaires du dossier:', err);
      }
    });
  }

  /**
   * Charge les commentaires d'un document
   */
  loadDocumentComments(documentId: string): void {
    if (this.documentComments.has(documentId)) {
      return; // Déjà chargés
    }

    this.loadingComments = true;
    this.commentaireService.getCommentairesByDocument(documentId).subscribe({
      next: (commentaires) => {
        this.documentComments.set(documentId, commentaires);
        this.loadingComments = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des commentaires:', err);
        this.loadingComments = false;
      }
    });
  }

  /**
   * Ouvre le modal pour ajouter une note sur un document
   */
  openAddNoteModal(document: DocumentMedical): void {
    this.selectedDocumentForComment = document;
    this.newCommentText = '';
    this.showCommentsModal = true;
    this.loadDocumentComments(document.id);
  }

  /**
   * Ferme le modal de commentaires
   */
  closeCommentsModal(): void {
    this.showCommentsModal = false;
    this.selectedDocumentForComment = null;
    this.newCommentText = '';
  }

  /**
   * Ajoute un commentaire sur un document
   */
  addComment(): void {
    if (!this.selectedDocumentForComment || !this.newCommentText.trim()) {
      return;
    }

    this.addingComment = true;
    const commentData: CreateCommentaireData = {
      idDocumentMedical: this.selectedDocumentForComment.id,
      contenu: this.newCommentText.trim()
    };

    this.commentaireService.createCommentaire(commentData).subscribe({
      next: (commentaire) => {
        // Ajouter le commentaire à la liste
        const comments = this.documentComments.get(this.selectedDocumentForComment!.id) || [];
        comments.push(commentaire);
        this.documentComments.set(this.selectedDocumentForComment!.id, comments);
        
        this.newCommentText = '';
        this.addingComment = false;
      },
      error: (err) => {
        console.error('Erreur lors de l\'ajout du commentaire:', err);
        alert('Erreur lors de l\'ajout de la note: ' + (err.error?.message || err.message));
        this.addingComment = false;
      }
    });
  }

  /**
   * Supprime un commentaire
   */
  deleteComment(commentaireId: string, documentId: string): void {
    if (!confirm('Voulez-vous vraiment supprimer cette note ?')) {
      return;
    }

    this.commentaireService.deleteCommentaire(commentaireId).subscribe({
      next: () => {
        const comments = this.documentComments.get(documentId) || [];
        const updatedComments = comments.filter(c => c.id !== commentaireId);
        this.documentComments.set(documentId, updatedComments);
      },
      error: (err) => {
        console.error('Erreur lors de la suppression du commentaire:', err);
        alert('Erreur lors de la suppression de la note: ' + (err.error?.message || err.message));
      }
    });
  }

  /**
   * Récupère les commentaires d'un document
   */
  getDocumentComments(documentId: string): Commentaire[] {
    return this.documentComments.get(documentId) || [];
  }

  /**
   * Récupère le nombre de commentaires d'un document
   */
  getCommentCount(documentId: string): number {
    return this.getDocumentComments(documentId).length;
  }
}
