import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiMeta {
  status: number;
  message: string;
  criticity: number;
  code?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  idUser?: number;
  idPerson?: number;
  email?: string;
  firstName?: string;
  secondName?: string;
  lastName?: string;
  secondLastName?: string;
  fullName?: string;
  phoneNumber?: string;
  userType?: 'student' | 'employee';
  isEmployee?: boolean;
  isStudent?: boolean;
  verificationRequired?: boolean;
}

export interface LoginResponse {
  data: AuthenticatedUser;
  meta: ApiMeta[];
  hasError: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth/login`;

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, { email, password });
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

  setCurrentUser(data: AuthenticatedUser): void {
    localStorage.setItem('currentUser', JSON.stringify(data));
  }

  getCurrentUser(): AuthenticatedUser | null {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthenticatedUser;
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
    return this.isEmployee();
  }

  hasHomeAccess(): boolean {
    return this.isStudent() || this.isEmployee();
  }
}
