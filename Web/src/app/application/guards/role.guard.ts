import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const requiredRoles = route.data['roles'] as Array<'patient' | 'medecin' | 'administrateur'>;
    
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/auth/login']);
    }

    const user = this.authService.getCurrentUser();
    
    if (user && requiredRoles.includes(user.typeUtilisateur)) {
      return true;
    }

    // Rediriger vers une page d'accès refusé ou dashboard
    return this.router.createUrlTree(['/dashboard']);
  }
}