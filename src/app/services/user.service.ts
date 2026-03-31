import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    userType: string;
  };
  meta: Array<{
    status: number;
    message: string;
    criticity: number;
  }>;
  hasError: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/users/register';

  constructor(private http: HttpClient) {}

  register(userData: UserRegister): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(this.apiUrl, userData);
  }
}