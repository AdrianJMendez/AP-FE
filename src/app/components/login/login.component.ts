import { Component, inject, signal } from '@angular/core';
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
  // Inyección de dependencias moderna con 'inject'
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Estados reactivos para la UI
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Definición del formulario con validaciones
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Getters para facilitar el acceso en el HTML
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit(): void {
    // 1. Validar formulario localmente
    if (this.loginForm.invalid) {
      this.error.set('Por favor completa correctamente el formulario.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.loginForm.value;

    // 2. Llamada real al servicio de autenticación
    this.authService.login(email, password).subscribe({
      next: (response: any) => {
      this.loading.set(false);

      if (response && !response.hasError) {
        const userId = response.data?.idUser || 'default';
        const user = response.data || {};

        this.authService.setCurrentUser(user);
        this.authService.setToken(`PUMA_TOKEN_${userId}`);

        console.log('Login exitoso:', response.meta?.[0]?.message);

        if (user.isEmployee) {
          this.router.navigate(['/admin']);
        } else if (user.isStudent) {
          this.router.navigate(['/home']);
        } else {
          // fallback seguro
          this.router.navigate(['/']);
        }
      } else {
        const msg = response.meta?.[0]?.message || 'Usuario o contraseña incorrectos.';
        this.error.set(msg);
      }
    },
      error: (err) => {
        this.loading.set(false);
        
        // Manejo de errores HTTP (401, 500, o servidor apagado)
        if (err.status === 401) {
          // Error controlado desde el Backend (Credenciales mal)
          const msg = err.error?.meta?.[0]?.message || 'Credenciales no válidas.';
          this.error.set(msg);
        } else {
          // Error de red o servidor caído
          this.error.set('Error de conexión con el servidor.');
        }
        console.error('Detalle del error:', err);
      }
    });
  }
}