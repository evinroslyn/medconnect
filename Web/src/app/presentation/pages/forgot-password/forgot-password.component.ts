import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../application/services/auth.service';

/**
 * Composant pour la réinitialisation du mot de passe
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  resetForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;
  step: 'request' | 'reset' = 'request';
  devCode: string | null = null; // Code en mode développement

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      telephone: ['', [Validators.required]],
      code: ['', []],
      nouveauMotDePasse: ['', []],
      confirmerMotDePasse: ['', []]
    });
  }

  /**
   * Demande de réinitialisation du mot de passe
   */
  requestReset(): void {
    if (this.resetForm.get('telephone')?.valid) {
      this.loading = true;
      this.error = null;

      const telephone = this.resetForm.get('telephone')?.value;

      this.authService.requestPasswordReset(telephone).subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response.success) {
            this.success = true;
            this.step = 'reset';
            // Ajouter le validateur pour le code maintenant
            this.resetForm.get('code')?.setValidators([Validators.required]);
            this.resetForm.get('nouveauMotDePasse')?.setValidators([Validators.required, Validators.minLength(8)]);
            this.resetForm.get('confirmerMotDePasse')?.setValidators([Validators.required]);
            this.resetForm.get('code')?.updateValueAndValidity();
            this.resetForm.get('nouveauMotDePasse')?.updateValueAndValidity();
            this.resetForm.get('confirmerMotDePasse')?.updateValueAndValidity();
            
            // En mode développement, pré-remplir le code si fourni (seulement si email non envoyé)
            if (response.devCode) {
              this.devCode = response.devCode;
              this.resetForm.get('code')?.setValue(response.devCode);
            }
          }
        },
        error: (err: Error) => {
          this.loading = false;
          this.error = err.message || "Erreur lors de la demande de réinitialisation. Veuillez réessayer.";
        }
      });
    } else {
      this.error = "Veuillez entrer votre numéro de téléphone.";
    }
  }

  /**
   * Réinitialisation du mot de passe avec le code
   */
  resetPassword(): void {
    if (this.resetForm.get('nouveauMotDePasse')?.value !== this.resetForm.get('confirmerMotDePasse')?.value) {
      this.error = "Les mots de passe ne correspondent pas.";
      return;
    }

    if (this.resetForm.get('code')?.valid && 
        this.resetForm.get('nouveauMotDePasse')?.valid && 
        this.resetForm.get('confirmerMotDePasse')?.valid) {
      this.loading = true;
      this.error = null;

      const telephone = this.resetForm.get('telephone')?.value;
      const code = this.resetForm.get('code')?.value;
      const nouveauMotDePasse = this.resetForm.get('nouveauMotDePasse')?.value;

      this.authService.resetPassword(telephone, code, nouveauMotDePasse).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.success = true;
            // Rediriger vers la page de connexion après 2 secondes
            setTimeout(() => {
              this.router.navigate(['/login'], {
                queryParams: { passwordReset: 'true' }
              });
            }, 2000);
          }
        },
        error: (err: Error) => {
          this.loading = false;
          this.error = err.message || "Erreur lors de la réinitialisation. Vérifiez votre code et réessayez.";
        }
      });
    } else {
      this.error = "Veuillez remplir tous les champs correctement.";
    }
  }

  /**
   * Retour à l'étape de demande
   */
  backToRequest(): void {
    this.step = 'request';
    this.success = false;
    this.error = null;
    this.devCode = null;
    this.resetForm.get('code')?.clearValidators();
    this.resetForm.get('nouveauMotDePasse')?.clearValidators();
    this.resetForm.get('confirmerMotDePasse')?.clearValidators();
    this.resetForm.get('code')?.updateValueAndValidity();
    this.resetForm.get('nouveauMotDePasse')?.updateValueAndValidity();
    this.resetForm.get('confirmerMotDePasse')?.updateValueAndValidity();
    this.resetForm.patchValue({
      code: '',
      nouveauMotDePasse: '',
      confirmerMotDePasse: ''
    });
  }
}

