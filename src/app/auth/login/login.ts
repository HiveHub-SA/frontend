import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthError, AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected showError(field: 'email' | 'password'): boolean {
    const ctrl = this.form.get(field)!;
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  protected goToRecovery(): void {
    this.router.navigate(['/recuperar-contrasena']);
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();

    this.authService.login(email, password).subscribe((result) => {
      this.loading.set(false);
      if (result.error) {
        this.errorMessage.set(this.resolveError(result.error));
      } else {
        this.router.navigate(['/mapa']);
      }
    });
  }

  private resolveError(error: AuthError): string {
    const messages: Record<AuthError, string> = {
      INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
      INVALID_CODE: 'Código inválido o expirado',
      EMAIL_TAKEN: 'Ya existe una cuenta con ese email',
      INVALID_API_KEY: 'API key inválida',
      SERVER_ERROR: 'Error del servidor, intentá más tarde',
      NETWORK_ERROR: 'Error de conexión, intentá más tarde',
    };
    return messages[error];
  }
}
