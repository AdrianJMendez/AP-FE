import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AlertService } from '../../shared/alert.service';
import { UserService, VerificationResponse } from '../../services/user.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly alertService = inject(AlertService);

  readonly loading = signal(false);
  readonly resendLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly verifyForm: FormGroup = this.fb.group({
    email: [
      this.route.snapshot.queryParamMap.get('email') || '',
      [Validators.required, Validators.email]
    ],
    code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
  });

  get email() {
    return this.verifyForm.get('email');
  }

  get code() {
    return this.verifyForm.get('code');
  }

  onSubmit(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      this.error.set('Ingresa tu correo y el codigo de 6 digitos.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const email = String(this.email?.value ?? '').trim().toLowerCase();
    const code = String(this.code?.value ?? '').trim();

    this.userService.verifyEmail(email, code).subscribe({
      next: (response: VerificationResponse) => {
        this.loading.set(false);
        this.alertService.success(
          'Correo verificado',
          response.meta[0]?.message || 'Tu cuenta ya puede iniciar sesion.'
        );
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.meta?.[0]?.message || 'No fue posible verificar el correo.');
      }
    });
  }

  resendCode(): void {
    const email = String(this.email?.value ?? '').trim().toLowerCase();

    if (!email || this.email?.invalid) {
      this.email?.markAsTouched();
      this.error.set('Escribe un correo valido para reenviar el codigo.');
      return;
    }

    this.resendLoading.set(true);
    this.error.set(null);

    this.userService.resendVerificationCode(email).subscribe({
      next: (response: VerificationResponse) => {
        this.resendLoading.set(false);
        this.code?.reset('');
        const title = response.data.emailSent ? 'Codigo reenviado' : 'Codigo generado';
        this.alertService.info(title, response.meta[0]?.message || 'Revisa tu correo.');
      },
      error: (err) => {
        this.resendLoading.set(false);
        this.error.set(err.error?.meta?.[0]?.message || 'No fue posible reenviar el codigo.');
      }
    });
  }
}
