import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService, RegisterData } from '@/application/services/auth.service';
import { FileService } from '@/application/services/file.service';

/**
 * Composant d'inscription pour les médecins
 */
@Component({
  selector: 'app-medecin-inscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './inscription.component.html',
  styleUrls: ['./inscription.component.scss']
})
export class MedecinInscriptionComponent {
  inscriptionForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;
  
  // Fichiers sélectionnés
  documentIdentiteFile: File | null = null;
  diplomeFile: File | null = null;
  photoProfilFile: File | null = null;
  
  // Prévisualisations
  documentIdentitePreview: string | null = null;
  diplomePreview: string | null = null;
  photoProfilPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private fileService: FileService,
    private router: Router
  ) {
    this.inscriptionForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      mail: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required]],
      specialite: ['', [Validators.required]],
      anneesExperience: ['', [Validators.required]],
      numeroLicence: ['', [Validators.required]],
      etatPays: ['', [Validators.required]],
      pays: ['', [Validators.required]],
      adresse: ['']
    });
  }

  /**
   * Gère la sélection d'un fichier
   */
  onFileSelected(event: Event, type: 'documentIdentite' | 'diplome' | 'photoProfil'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      switch (type) {
        case 'documentIdentite':
          this.documentIdentiteFile = file;
          this.createPreview(file, 'documentIdentite');
          break;
        case 'diplome':
          this.diplomeFile = file;
          this.createPreview(file, 'diplome');
          break;
        case 'photoProfil':
          this.photoProfilFile = file;
          this.createPreview(file, 'photoProfil');
          break;
      }
    }
  }

  /**
   * Crée une prévisualisation du fichier
   */
  private createPreview(file: File, type: 'documentIdentite' | 'diplome' | 'photoProfil'): void {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          switch (type) {
            case 'documentIdentite':
              this.documentIdentitePreview = e.target.result as string;
              break;
            case 'diplome':
              this.diplomePreview = e.target.result as string;
              break;
            case 'photoProfil':
              this.photoProfilPreview = e.target.result as string;
              break;
          }
        }
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Supprime un fichier sélectionné
   */
  removeFile(type: 'documentIdentite' | 'diplome' | 'photoProfil'): void {
    switch (type) {
      case 'documentIdentite':
        this.documentIdentiteFile = null;
        this.documentIdentitePreview = null;
        break;
      case 'diplome':
        this.diplomeFile = null;
        this.diplomePreview = null;
        break;
      case 'photoProfil':
        this.photoProfilFile = null;
        this.photoProfilPreview = null;
        break;
    }
  }


  /**
   * Normalise le numéro de téléphone au format attendu par le backend
   * Format attendu: +237612345678 ou 612345678
   */
  private normalizeTelephone(telephone: string): string {
    // Enlever tous les espaces et caractères spéciaux sauf le +
    let normalized = telephone.replace(/[\s\-\(\)]/g, '');
    
    console.log('📞 Téléphone original:', telephone);
    console.log('📞 Téléphone après nettoyage:', normalized);
    
    // Si le numéro commence par 6 ou 7 suivi de 8 chiffres (format local), ajouter +237
    if (/^[67]\d{8}$/.test(normalized)) {
      normalized = '+237' + normalized;
      console.log('📞 Format local détecté, ajout de +237:', normalized);
    }
    // Si le numéro commence déjà par +237, le garder tel quel
    else if (normalized.startsWith('+237')) {
      console.log('📞 Format +237 déjà présent:', normalized);
      // Vérifier que le format est correct: +237 suivi de 6 ou 7 puis 8 chiffres
      if (!/^\+237[67]\d{8}$/.test(normalized)) {
        console.warn('⚠️ Format +237 invalide, tentative de correction');
        // Extraire les 9 derniers chiffres (237 + 8 chiffres)
        const digits = normalized.replace(/\D/g, '');
        if (digits.length >= 11 && digits.startsWith('237')) {
          normalized = '+237' + digits.substring(3);
        }
      }
    }
    // Si le numéro commence par 237 sans le +, ajouter le +
    else if (normalized.startsWith('237')) {
      normalized = '+' + normalized;
      console.log('📞 Format 237 détecté, ajout du +:', normalized);
    }
    // Si aucun format reconnu, essayer d'extraire les chiffres
    else {
      const digits = normalized.replace(/\D/g, '');
      if (digits.length === 9 && /^[67]/.test(digits)) {
        normalized = '+237' + digits;
        console.log('📞 Extraction des chiffres, format corrigé:', normalized);
      } else {
        console.warn('⚠️ Format de téléphone non reconnu:', normalized);
      }
    }
    
    console.log('📞 Téléphone final normalisé:', normalized);
    return normalized;
  }

  /**
   * Gère la soumission du formulaire d'inscription
   */
  onSubmit(): void {
    if (this.inscriptionForm.valid && this.documentIdentiteFile && this.diplomeFile) {
      this.loading = true;
      this.error = null;

      const formValue = this.inscriptionForm.value;
      
      // Normaliser le numéro de téléphone
      const normalizedTelephone = this.normalizeTelephone(formValue.telephone);
      
      // Upload des fichiers en parallèle
      const uploads = [
        this.fileService.uploadDocumentIdentite(this.documentIdentiteFile),
        this.fileService.uploadDiplome(this.diplomeFile)
      ];

      if (this.photoProfilFile) {
        uploads.push(
          this.fileService.uploadPhotoProfil(this.photoProfilFile)
        );
      }

      // Utiliser forkJoin pour exécuter les uploads en parallèle
      forkJoin(uploads).subscribe({
        next: (results) => {
          const documentIdentite = results[0];
          const diplome = results[1];
          const photoProfil = results[2]; // Peut être undefined si non fourni
          
          const registerData: RegisterData = {
            telephone: normalizedTelephone,
            typeUtilisateur: 'medecin',
            nom: formValue.nom.trim(),
            mail: formValue.mail.trim().toLowerCase(),
            adresse: formValue.adresse?.trim() || undefined,
            specialite: formValue.specialite.trim(),
            numeroLicence: formValue.numeroLicence.trim(),
            documentIdentite: documentIdentite,
            diplome: diplome,
            photoProfil: photoProfil || undefined
          };
          
          console.log('📤 Données d\'inscription envoyées:', JSON.stringify(registerData, null, 2));
          console.log('📤 Téléphone normalisé:', normalizedTelephone);
          console.log('📤 Document identité:', documentIdentite);
          console.log('📤 Diplôme:', diplome);
          console.log('📤 Photo profil:', photoProfil);
          
          this.authService.register(registerData).subscribe({
            next: (response) => {
              console.log('✅ Réponse d\'inscription:', response);
              this.success = true;
              this.loading = false;
              
              // Rediriger automatiquement vers la page de connexion après 2 secondes pour laisser le temps de voir le message de succès
              setTimeout(() => {
                console.log('🔄 Redirection vers /login...');
                this.router.navigate(['/login'], { 
                  queryParams: { 
                    registered: 'true'
                  },
                  replaceUrl: true // Remplacer l'historique pour éviter de revenir en arrière
                }).then(() => {
                  console.log('✅ Redirection réussie vers /login');
                }).catch((err) => {
                  console.error('❌ Erreur lors de la redirection:', err);
                });
              }, 2000);
            },
            error: (err: any) => {
              console.error('❌ Erreur d\'inscription complète:', err);
              console.error('❌ err.error:', err.error);
              console.error('❌ err.message:', err.message);
              
              // Le message d'erreur est déjà formaté par AuthService.handleError
              // Il contient déjà les détails de validation si disponibles
              const errorMessage = err.message || "Erreur lors de l'inscription. Veuillez réessayer.";
              
              // Afficher l'erreur (les détails sont déjà inclus dans le message)
              this.error = errorMessage;
              this.loading = false;
            }
          });
        },
        error: (err: any) => {
          console.error('❌ Erreur lors du téléversement des fichiers:', err);
          let errorMessage = "Erreur lors du téléversement des fichiers. Veuillez réessayer.";
          
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.message) {
            errorMessage = err.message;
          }
          
          this.error = errorMessage;
          this.loading = false;
        }
      });
    } else {
      // Vérifier quels champs manquent
      const missingFields: string[] = [];
      if (!this.inscriptionForm.get('nom')?.valid) missingFields.push('Nom');
      if (!this.inscriptionForm.get('mail')?.valid) missingFields.push('Email');
      if (!this.inscriptionForm.get('telephone')?.valid) missingFields.push('Téléphone');
      if (!this.inscriptionForm.get('specialite')?.valid) missingFields.push('Spécialité');
      if (!this.inscriptionForm.get('numeroLicence')?.valid) missingFields.push('Numéro de licence');
      if (!this.documentIdentiteFile) missingFields.push('Document d\'identité');
      if (!this.diplomeFile) missingFields.push('Diplôme');
      
      this.error = `Veuillez remplir tous les champs obligatoires${missingFields.length > 0 ? ': ' + missingFields.join(', ') : ''}.`;
    }
  }
}

