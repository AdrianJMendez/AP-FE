import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AlertService } from '../../shared/alert.service';
import { AuthService, LoginResponse } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly alertService = inject(AlertService);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.error.set('Por favor completa correctamente el formulario.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const email = String(this.loginForm.get('email')?.value ?? '').trim().toLowerCase();
    const password = String(this.loginForm.get('password')?.value ?? '');

    this.authService.login(email, password).subscribe({
      next: (response: LoginResponse) => {
        this.loading.set(false);

        if (response && !response.hasError) {
          const userId = response.data?.idUser || 'default';
          const user = response.data || {};

          this.authService.setCurrentUser(user);
          this.authService.setToken(`PUMA_TOKEN_${userId}`);

          if (user.isEmployee) {
            this.router.navigate(['/admin']);
          } else if (user.isStudent) {
            this.router.navigate(['/home']);
          } else {
            this.router.navigate(['/login']);
          }

          return;
        }

        this.error.set(response.meta?.[0]?.message || 'No fue posible iniciar sesion.');
      },
      error: (err) => {
        this.loading.set(false);

        const response = err.error as LoginResponse | undefined;
        const meta = response?.meta?.[0];
        const message = meta?.message || 'Error de conexion con el servidor.';

        if (err.status === 403 && meta?.code === 'EMAIL_NOT_VERIFIED') {
          const unverifiedEmail = response?.data?.email || email;
          this.alertService.warning('Correo pendiente', message);
          this.router.navigate(['/verify-email'], {
            queryParams: { email: unverifiedEmail }
          });
          return;
        }

        this.error.set(message);
        console.error('Detalle del error:', err);
      }
    });
  }
}
