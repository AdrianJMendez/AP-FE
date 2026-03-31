import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService, UserRegister } from '../../services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private userService = inject(UserService);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Formulario de registro
  registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    secondName: [''],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    secondLastName: [''],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{4}-[0-9]{4}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    userType: ['student', [Validators.required]]
  }, {
    validators: this.passwordMatchValidator
  });

  // Confirmar contraseña
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.error.set('Por favor completa correctamente todos los campos');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    // Preparar datos para enviar al backend
    const userData: UserRegister = {
      firstName: this.registerForm.get('firstName')?.value,
      secondName: this.registerForm.get('secondName')?.value || '',
      lastName: this.registerForm.get('lastName')?.value,
      secondLastName: this.registerForm.get('secondLastName')?.value || '',
      email: this.registerForm.get('email')?.value,
      phoneNumber: this.registerForm.get('phoneNumber')?.value,
      password: this.registerForm.get('password')?.value,
      userType: this.registerForm.get('userType')?.value
    };

    console.log('Enviando registro:', userData); // Para debug

    this.userService.register(userData).subscribe({
      next: (response) => {
        this.loading.set(false);
        
        if (!response.hasError && response.meta[0]?.status === 201) {
          this.success.set(response.meta[0]?.message || 'Usuario registrado exitosamente');
          
          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.error.set(response.meta[0]?.message || 'Error en el registro');
        }
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Error en registro:', err);
        
        if (err.status === 409) {
          this.error.set('El correo electrónico ya está registrado');
        } else if (err.status === 400) {
          this.error.set('Datos inválidos. Verifica la información');
        } else {
          this.error.set('Error de conexión con el servidor');
        }
      }
    });
  }

  // Getters
  get firstName() { return this.registerForm.get('firstName'); }
  get secondName() { return this.registerForm.get('secondName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get secondLastName() { return this.registerForm.get('secondLastName'); }
  get email() { return this.registerForm.get('email'); }
  get phoneNumber() { return this.registerForm.get('phoneNumber'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get userType() { return this.registerForm.get('userType'); }
}