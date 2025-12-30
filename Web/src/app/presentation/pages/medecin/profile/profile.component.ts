import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@/application/services/auth.service';
import { MedecinService } from '@/application/services/medecin.service';

@Component({
  selector: 'app-medecin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class MedecinProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  currentUser: any = null;
  userProfile: any = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  activeTab: 'profile' | 'password' = 'profile';

  constructor(
    private authService: AuthService,
    private medecinService: MedecinService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      nom: ['', Validators.required],
      mail: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      specialite: ['', Validators.required],
      numeroLicence: ['', Validators.required],
      adresse: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword) {
      confirmPassword.setErrors(null);
    }
    return null;
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserProfile();
    if (this.currentUser) {
      this.profileForm.patchValue({
        nom: this.currentUser.nom || '',
        mail: this.currentUser.mail || '',
        telephone: this.currentUser.telephone || '',
        specialite: this.currentUser.specialite || '',
        numeroLicence: this.currentUser.numeroLicence || '',
        adresse: this.currentUser.adresse || ''
      });
    }
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

  setActiveTab(tab: 'profile' | 'password'): void {
    this.activeTab = tab;
    this.error = null;
    this.success = null;
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    // Ici, vous devrez créer une méthode dans le service pour mettre à jour le profil
    // Pour l'instant, on simule avec localStorage
    const updatedUser = {
      ...this.currentUser,
      ...this.profileForm.value
    };
    
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    this.currentUser = updatedUser;
    this.loading = false;
    this.success = 'Profil mis à jour avec succès';
    
    // TODO: Appeler l'API pour mettre à jour le profil
    // this.medecinService.updateProfile(this.profileForm.value).subscribe({...});
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const { currentPassword, newPassword } = this.passwordForm.value;

    // TODO: Appeler l'API pour changer le mot de passe
    // this.authService.changePassword(currentPassword, newPassword).subscribe({
    //   next: () => {
    //     this.success = 'Mot de passe modifié avec succès';
    //     this.passwordForm.reset();
    //     this.loading = false;
    //   },
    //   error: (err) => {
    //     this.error = err.message || 'Erreur lors de la modification du mot de passe';
    //     this.loading = false;
    //   }
    // });

    // Simulation pour l'instant
    setTimeout(() => {
      this.success = 'Mot de passe modifié avec succès';
      this.passwordForm.reset();
      this.loading = false;
    }, 1000);
  }
}

