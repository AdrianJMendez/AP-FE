import { Component, inject, signal } from '@angular/core'; // CORREGIDO: Viene de @angular/core
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.error.set('Por favor completa correctamente el formulario');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Simulación para frontend
    setTimeout(() => {
      this.loading.set(false);
      this.authService.setToken('token_puma_provisional_2026');
      console.log('Login exitoso. ¡Vámonos al Home!');
      this.router.navigate(['/home']);
    }, 1500); 
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}