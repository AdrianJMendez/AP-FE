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
  if (this.loginForm.invalid) {
    this.error.set('Por favor completa correctamente el formulario.');
    return;
  }

  this.loading.set(true);
  this.error.set(null);

  const { email, password } = this.loginForm.value;

  this.authService.login(email, password).subscribe({
  next: (response: any) => {
    this.loading.set(false);
    console.log('Respuesta recibida:', response);

    // CAMBIO AQUÍ: Si recibimos un objeto con idUser, el login fue un éxito
    if (response && response.idUser) {
      
      // Guardamos al usuario directamente (porque response YA es el usuario)
      localStorage.setItem('currentUser', JSON.stringify(response));
      
      // Generamos el token con el ID que ya vimos que es el 5
      this.authService.setToken(`PUMA_TOKEN_${response.idUser}`);
      
      console.log('¡Acceso concedido! Navegando...');
      this.router.navigate(['/home']);
    } else {
      this.error.set('No se pudo procesar la información del usuario.');
    }
  },
  error: (err) => {
    this.loading.set(false);
    this.error.set('Usuario o contraseña incorrectos.');
    console.error('Error HTTP:', err);
  }
});
}}