import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthError, AuthService } from '../../core/services/auth.service';
import { CreateUserResponse } from '../auth.models';

function passwordsMatchValidator(group: import('@angular/forms').AbstractControl) {
  const pw = group.get('password')?.value ?? '';
  const confirm = group.get('confirmPassword')?.value ?? '';
  return pw === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class RegistroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly createdUser = signal<CreateUserResponse | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly showApiKey = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      apiKey: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  protected showError(field: 'email' | 'password' | 'confirmPassword' | 'apiKey'): boolean {
    const ctrl = this.form.get(field)!;
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.createdUser.set(null);

    const { email, password, apiKey } = this.form.getRawValue();

    this.authService.createUser(email, password, apiKey).subscribe((result) => {
      this.loading.set(false);
      if (result.error) {
        this.errorMessage.set(this.resolveError(result.error));
      } else {
        this.createdUser.set(result.data!);
        this.form.reset();
      }
    });
  }

  private resolveError(error: AuthError): string {
    const messages: Record<AuthError, string> = {
      INVALID_CREDENTIALS: 'Credenciales inválidas',
      INVALID_CODE: 'Código inválido',
      EMAIL_TAKEN: 'Ya existe una cuenta con ese email',
      INVALID_API_KEY: 'API key inválida',
      SERVER_ERROR: 'Error del servidor, intentá más tarde',
      NETWORK_ERROR: 'Error de conexión, intentá más tarde',
    };
    return messages[error];
  }
}
