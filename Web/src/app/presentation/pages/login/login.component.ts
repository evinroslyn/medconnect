import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { AuthService, User } from "../../../application/services/auth.service";

/**
 * Composant de la page de connexion
 */
@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;
  showPassword = false;
  rememberMe = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required]],
      password: ["", [Validators.required]],
      rememberMe: [false]
    });
  }

  /**
   * Bascule la visibilité du mot de passe
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Vérifie si c'est une tentative de connexion d'un médecin
   * (basé sur l'email ou le format du login)
   */
  private isMedecinLogin(email: string): boolean {
    // Pour l'instant, on ne peut pas déterminer si c'est un médecin avant la connexion
    // Cette méthode sera utilisée après avoir reçu la réponse du serveur
    return false;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = null;

      const { email, password } = this.loginForm.value;

      // Déterminer si l'input est un email ou un numéro de téléphone
      const loginPayload: { telephone?: string; mail?: string; motDePasse: string } = { motDePasse: password };
      if (email.includes('@')) {
        loginPayload.mail = email;
      } else {
        loginPayload.telephone = email;
      }

      console.log('🚀 Début de la connexion avec payload:', loginPayload);

      this.authService.login(loginPayload).subscribe({
        next: (response) => {
          console.log('═══════════════════════════════════════════════════════════');
          console.log('📥 LoginComponent: Réponse reçue du serveur');
          console.log('   response.success:', response.success);
          console.log('   response.token:', response.token ? response.token.substring(0, 30) + '...' : 'UNDEFINED');
          console.log('   response.user:', response.user);
          console.log('   response.message:', response.message);
          console.log('═══════════════════════════════════════════════════════════');

          this.loading = false;

          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.component.ts:74',message:'Évaluation connexion médecin',data:{isMedecin:response.user?.typeUtilisateur==='medecin',require2FA:response.user?.require2FA,success:response.success,hasToken:!!response.token,hasUser:!!response.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion

          // Vérifier que le token a été sauvegardé
          // IMPORTANT: Pour les médecins, ignorer complètement require2FA même si le backend l'envoie
          const isMedecin = response.user?.typeUtilisateur === 'medecin';
          const shouldConnect = response.success && response.token && response.user && (!response.user?.require2FA || isMedecin);

          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.component.ts:76',message:'Résultat évaluation connexion',data:{shouldConnect,isMedecin,require2FA:response.user?.require2FA},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion

          if (shouldConnect) {
            console.log('✅ Conditions OK: success=true, token existe, user existe');
            if (isMedecin && response.user?.require2FA) {
              console.log('⚠️ Médecin avec require2FA=true détecté, 2FA ignorée');
            }

            // Sauvegarder le token IMMÉDIATEMENT de manière synchrone AVANT toute navigation
            console.log('💾 Sauvegarde du token dans localStorage...');
            localStorage.setItem('auth_token', response.token!);
            localStorage.setItem('user_data', JSON.stringify(response.user));

            // Vérifier immédiatement que le token est bien sauvegardé
            const savedToken = localStorage.getItem('auth_token');
            console.log('✅ localStorage.getItem("auth_token"):', savedToken ? savedToken.substring(0, 30) + '...' : 'NULL');

            if (!savedToken) {
              console.error('❌ ERREUR CRITIQUE: Token non sauvegardé dans localStorage!');
              this.error = "Erreur lors de la sauvegarde de la session. Veuillez réessayer.";
              return;
            }

            // Mettre à jour les BehaviorSubjects dans AuthService
            const user: User = {
              id: response.user!.id,
              telephone: response.user!.telephone,
              typeUtilisateur: response.user!.typeUtilisateur as 'patient' | 'medecin' | 'administrateur',
              nom: response.user!.nom
            };
            this.authService.saveAuthData(response.token!, user);

            console.log('🔀 Redirection en cours vers:', user.typeUtilisateur === 'administrateur' ? '/admin/dashboard' : '/medecin/dashboard');

            // Rediriger selon le type d'utilisateur
            if (user.typeUtilisateur === 'administrateur') {
              this.router.navigate(['/admin/dashboard']);
            } else if (user.typeUtilisateur === 'medecin') {
              this.router.navigate(['/medecin/dashboard']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          } else {
            console.warn('⚠️ Conditions NOT OK pour sauvegarder le token');
            console.log('   response.success:', response.success);
            console.log('   response.token exists:', !!response.token);
            console.log('   response.user exists:', !!response.user);

            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.component.ts:126',message:'Affichage message erreur',data:{typeUtilisateur:response.user?.typeUtilisateur,require2FA:response.user?.require2FA,message:response.message?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion

            // IMPORTANT: Les médecins n'ont JAMAIS besoin de 2FA
              // Si le backend envoie un message de 2FA pour un médecin, on l'ignore
            const isMedecin = response.user?.typeUtilisateur === 'medecin';
            const is2FAMessage = response.message?.includes('code de vérification') || response.message?.includes('vérification');

            if (isMedecin && is2FAMessage) {
              console.warn('⚠️ Message 2FA ignoré pour médecin');
              this.error = "Erreur de connexion. Veuillez réessayer.";
            } else {
              this.error = response.message || "Erreur de connexion. Vérifiez vos identifiants.";
            }
          }
        },
        error: (err: Error) => {
          console.error('❌ Erreur login:', err);
          this.error = err.message || "Erreur de connexion. Vérifiez vos identifiants.";
          this.loading = false;
        },
      });
    }
  }
}

