import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/auth/login';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    const loginData: LoginRequest = { email, password };
    return this.http.post<LoginResponse>(this.apiUrl, loginData);
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('currentUser');
  }

  setCurrentUser(data: any): void {
    localStorage.setItem('currentUser', JSON.stringify(data));
  }

  getCurrentUser(): { idUser?: number; isEmployee?: boolean; isStudent?: boolean } | null {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  isEmployee(): boolean {
    return !!this.getCurrentUser()?.isEmployee;
  }

  isStudent(): boolean {
    return !!this.getCurrentUser()?.isStudent;
  }

  hasAdminAccess(): boolean {
    // Preferencia: si es empleado (incluso si también es estudiante), acceso admin.
    return this.isEmployee();
  }

  hasHomeAccess(): boolean {
    // El estudiante o empleado puede ver home.
    return this.isStudent() || this.isEmployee();
  }
}
