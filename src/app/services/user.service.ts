import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiMeta } from './auth.service';
import { environment } from '../../environments/environment';

export interface UserRegister {
  firstName: string;
  secondName: string;
  lastName: string;
  secondLastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  userType: 'student' | 'employee';
}

export interface RegisterResponse {
  data: {
    idUser: number;
    userType: 'student' | 'employee';
    email: string | null;
    verificationExpiresAt: string | null;
    emailSent: boolean;
  };
  meta: ApiMeta[];
  hasError: boolean;
}

export interface VerificationResponse {
  data: {
    idUser: number;
    email: string;
    userType: 'student' | 'employee';
    isEmailVerified?: boolean;
    expiresAt?: string;
    emailSent?: boolean;
  };
  meta: ApiMeta[];
  hasError: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  register(userData: UserRegister, userType: 'student' | 'employee'): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register/${userType}`, userData);
  }

  verifyEmail(email: string, code: string): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${this.apiUrl}/verify-email`, {
      email,
      code
    });
  }

  resendVerificationCode(email: string): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${this.apiUrl}/resend-verification-code`, {
      email
    });
  }
}
