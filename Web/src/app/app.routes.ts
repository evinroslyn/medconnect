import { Routes } from '@angular/router';
import { AuthGuard } from './application/guards/auth.guard';
import { RoleGuard } from './application/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./presentation/pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register/medecin',
    loadComponent: () => import('./presentation/pages/medecin/inscription/inscription.component').then(m => m.MedecinInscriptionComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./presentation/pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'auth',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'medecin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['medecin'] },
    loadComponent: () => import('./presentation/layouts/medecin-layout/medecin-layout.component').then(m => m.MedecinLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./presentation/pages/medecin/dashboard/dashboard.component').then(m => m.MedecinDashboardComponent),
      },
      // Routes patients - les plus spécifiques en premier (important pour le routage Angular)
      {
        path: 'patients/:patientId/dossiers/:dossierId',
        loadComponent: () => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.routes.ts:31',message:'Lazy loading DossierViewComponent started',data:{path:'patients/:patientId/dossiers/:dossierId'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          return import('./presentation/pages/medecin/dossier-view/dossier-view.component').then(m => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.routes.ts:34',message:'Lazy loading DossierViewComponent success',data:{hasComponent:!!m.DossierViewComponent,componentName:m.DossierViewComponent?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            return m.DossierViewComponent;
          }).catch(err => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.routes.ts:37',message:'Lazy loading DossierViewComponent error',data:{error:err.message,stack:err.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            throw err;
          });
        },
      },
      {
        path: 'patients/:id',
        loadComponent: () => import('./presentation/pages/medecin/patient-profile/patient-profile.component').then(m => m.PatientProfileComponent),
      },
      {
        path: 'patients',
        loadComponent: () => import('./presentation/pages/medecin/patient/patient.component').then(m => m.MedecinPatientComponent),
      },
      {
        path: 'chat',
        loadComponent: () => import('./presentation/pages/medecin/chat/chat.component').then(m => m.MedecinChatComponent),
      },
      {
        path: 'chat/:patientId',
        loadComponent: () => import('./presentation/pages/medecin/chat/chat.component').then(m => m.MedecinChatComponent),
      },
      {
        path: 'rendez-vous',
        loadComponent: () => import('./presentation/pages/medecin/rendez-vous/rendez-vous.component').then(m => m.MedecinRendezVousComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./presentation/pages/medecin/profile/profile.component').then(m => m.MedecinProfileComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['administrateur'] },
    loadComponent: () => import('./presentation/layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./presentation/pages/Admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'verification',
        loadComponent: () => import('./presentation/pages/Admin/verification/verification.component').then(m => m.AdminVerificationComponent),
      },
      {
        path: 'patients',
        loadComponent: () => import('./presentation/pages/Admin/patients/patients.component').then(m => m.AdminPatientsComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./presentation/pages/Admin/users/users.component').then(m => m.AdminUsersComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./presentation/pages/Admin/settings/settings.component').then(m => m.AdminSettingsComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
];
