import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthError, AuthService } from '../../core/services/auth.service';

type Paso = 1 | 2 | 3;

function passwordsMatchValidator(group: import('@angular/forms').AbstractControl) {
  const pw = group.get('newPassword')?.value ?? '';
  const confirm = group.get('confirmPassword')?.value ?? '';
  return pw === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-recuperar-contrasena',
  imports: [ReactiveFormsModule],
  templateUrl: './recuperar-contrasena.html',
  styleUrl: './recuperar-contrasena.css',
})
export class RecuperarContrasenaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly paso = signal<Paso>(1);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly emailUsado = signal('');
  protected readonly showPassword = signal(false);
  protected readonly resending = signal(false);
  protected readonly codeResentMessage = signal<string | null>(null);

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly codigoForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  protected readonly passwordForm = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  protected showError(form: import('@angular/forms').FormGroup, field: string): boolean {
    const ctrl = form.get(field)!;
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  protected goBack(): void {
    if (this.paso() > 1) {
      this.paso.update((p) => (p - 1) as Paso);
      this.errorMessage.set(null);
    } else {
      this.router.navigate(['/login']);
    }
  }

  protected onSubmitEmail(): void {
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    const { email } = this.emailForm.getRawValue();

    this.authService.forgotPassword(email).subscribe((result) => {
      this.loading.set(false);
      if (result.error) {
        this.errorMessage.set(this.resolveError(result.error));
      } else {
        this.emailUsado.set(email);
        this.paso.set(2);
      }
    });
  }

  protected onSubmitCodigo(): void {
    this.codigoForm.markAllAsTouched();
    if (this.codigoForm.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    const { code } = this.codigoForm.getRawValue();

    this.authService.verifyCode(this.emailUsado(), code).subscribe((result) => {
      this.loading.set(false);
      if (result.error) {
        this.errorMessage.set(this.resolveError(result.error));
      } else {
        this.paso.set(3);
      }
    });
  }

  protected reenviarCodigo(): void {
    if (this.resending()) return;
    this.resending.set(true);
    this.errorMessage.set(null);

    this.authService.forgotPassword(this.emailUsado()).subscribe((result) => {
      this.resending.set(false);
      if (result.error) {
        this.errorMessage.set(this.resolveError(result.error));
      } else {
        this.codeResentMessage.set('Código reenviado');
        setTimeout(() => this.codeResentMessage.set(null), 3000);
      }
    });
  }

  protected onSubmitPassword(): void {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const { newPassword } = this.passwordForm.getRawValue();
    const { code } = this.codigoForm.getRawValue();

    this.authService.resetPassword(this.emailUsado(), code, newPassword).subscribe((result) => {
      this.loading.set(false);
      if (result.error) {
        this.errorMessage.set(this.resolveError(result.error));
      } else {
        this.router.navigate(['/login'], {
          state: { successMessage: 'Contraseña actualizada. Podés iniciar sesión.' },
        });
      }
    });
  }

  private resolveError(error: AuthError): string {
    const messages: Record<AuthError, string> = {
      INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
      INVALID_CODE: 'Código inválido o expirado. Solicitá uno nuevo',
      EMAIL_TAKEN: 'Ya existe una cuenta con ese email',
      INVALID_API_KEY: 'API key inválida',
      SERVER_ERROR: 'Error del servidor, intentá más tarde',
      NETWORK_ERROR: 'Error de conexión, intentá más tarde',
    };
    return messages[error];
  }
}
