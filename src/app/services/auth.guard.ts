import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['']);
    }

    if (this.authService.hasAdminAccess()) {
      return true;
    }

    // Si no es empleado, no puede acceder a /admin
    if (this.authService.hasHomeAccess()) {
      return this.router.createUrlTree(['/home']);
    }

    return this.router.createUrlTree(['']);
  }
}
