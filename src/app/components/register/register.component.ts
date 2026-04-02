import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AlertService } from '../../shared/alert.service';
import { UserRegister, UserService } from '../../services/user.service';

type UserType = 'student' | 'employee';

interface RegisterViewConfig {
  userType: UserType;
  badge: string;
  title: string;
  subtitle: string;
  helper: string;
  submitLabel: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(UserService);
  private readonly alertService = inject(AlertService);

  readonly viewConfig = signal<RegisterViewConfig>(this.resolveViewConfig());
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly registerForm: FormGroup = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      secondName: [''],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      secondLastName: [''],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{4}-[0-9]{4}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: this.passwordMatchValidator(),
    }
  );

  get firstName() {
    return this.registerForm.get('firstName');
  }

  get secondName() {
    return this.registerForm.get('secondName');
  }

  get lastName() {
    return this.registerForm.get('lastName');
  }

  get secondLastName() {
    return this.registerForm.get('secondLastName');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get phoneNumber() {
    return this.registerForm.get('phoneNumber');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.error.set('Por favor completa correctamente todos los campos.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const payload: UserRegister = {
      firstName: String(this.firstName?.value ?? '').trim(),
      secondName: String(this.secondName?.value ?? '').trim(),
      lastName: String(this.lastName?.value ?? '').trim(),
      secondLastName: String(this.secondLastName?.value ?? '').trim(),
      email: String(this.email?.value ?? '').trim().toLowerCase(),
      phoneNumber: String(this.phoneNumber?.value ?? '').trim(),
      password: String(this.password?.value ?? ''),
      userType: this.viewConfig().userType,
    };

    this.userService.register(payload, this.viewConfig().userType).subscribe({
      next: (response) => {
        this.loading.set(false);

        if (!response.hasError && response.meta[0]?.status === 201) {
          const message = response.meta[0]?.message || 'Cuenta creada correctamente.';
          if (response.data.emailSent) {
            this.alertService.success('Cuenta creada', message);
          } else {
            this.alertService.warning('Cuenta creada', message);
          }

          this.router.navigate(['/verify-email'], {
            queryParams: {
              email: payload.email,
              userType: this.viewConfig().userType,
            },
          });
          return;
        }

        this.error.set(response.meta[0]?.message || 'No fue posible completar el registro.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.meta?.[0]?.message || 'Error de conexion con el servidor.');
      }
    });
  }

  private resolveViewConfig(): RegisterViewConfig {
    const userType = (this.route.snapshot.data['userType'] as UserType | undefined) || 'student';

    if (userType === 'employee') {
      return {
        userType,
        badge: 'Acceso interno',
        title: 'Registro de empleados',
        subtitle: 'Este acceso queda reservado para altas internas hechas desde el panel administrativo.',
        helper: 'La cuenta se crea como empleado y debera verificar su correo antes de iniciar sesion.',
        submitLabel: 'Crear cuenta de empleado',
      };
    }

    return {
      userType,
      badge: 'Cuenta estudiantil',
      title: 'Crea tu cuenta en Ayuda PUMA',
      subtitle: 'Publica, dona o intercambia materiales con otros estudiantes en nuestra plataforma.',
      helper: 'El registro publico siempre crea cuentas de estudiante y luego solicita verificar el correo.',
      submitLabel: 'Crear mi cuenta',
    };
  }

  private passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;

      if (!password || !confirmPassword) {
        return null;
      }

      return password === confirmPassword ? null : { mismatch: true };
    };
  }
}
