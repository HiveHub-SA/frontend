import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateUserRequest,
  CreateUserResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
  VerifyCodeRequest,
} from '../../auth/auth.models';

export type AuthError =
  | 'INVALID_CREDENTIALS'
  | 'INVALID_CODE'
  | 'EMAIL_TAKEN'
  | 'INVALID_API_KEY'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR';

export interface AuthResult<T> {
  data?: T;
  error?: AuthError;
}

const SESSION_KEY = 'auth_email';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // ── Estado de sesión ──────────────────────────────────────────────────────
  // Se inicializa desde localStorage para que, si no hay conexión al arrancar,
  // la app recuerde que el usuario estaba logueado.
  private readonly _userEmail = signal<string | null>(localStorage.getItem(SESSION_KEY));

  readonly isAuthenticated = computed(() => this._userEmail() !== null);
  readonly userEmail = this._userEmail.asReadonly();

  // ── Rehidratación ─────────────────────────────────────────────────────────
  readonly sessionReady$: Observable<boolean> = this.http
    .get<LoginResponse>(`${this.base}/api/auth/me`)
    .pipe(
      map((res) => {
        // Sesión válida confirmada por el backend → persistir
        this.setSession(res.email);
        return true;
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 0) {
          // Error de red (sin conexión): confiar en lo que hay en localStorage.
          // Si había sesión guardada, el usuario sigue "autenticado" offline
          // y puede seguir usando la app. Cuando vuelva la conexión, el próximo
          // request al backend devolverá 401 si la cookie expiró, y ahí sí
          // se limpia la sesión.
          const cached = localStorage.getItem(SESSION_KEY);
          this._userEmail.set(cached);
          return of(cached !== null);
        }

        // 401 / 403: sesión inválida o expirada → limpiar todo
        this.clearSession();
        return of(false);
      }),
      shareReplay(1),
    );

  // ── Login ─────────────────────────────────────────────────────────────────
  login(email: string, password: string): Observable<AuthResult<LoginResponse>> {
    const body: LoginRequest = { email, password };
    return this.http.post<LoginResponse>(`${this.base}/api/auth/login`, body).pipe(
      map((res) => {
        this.setSession(res.email);
        return { data: res };
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) return [{ error: 'INVALID_CREDENTIALS' as AuthError }];
        return [this.mapHttpError(err)];
      }),
    );
  }

  // ── Logout ───────────────────────────────────────────────────────────────
  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/api/auth/logout`, {}, { withCredentials: true }).pipe(
      map(() => this.clearSession()),
      catchError(() => {
        this.clearSession();
        return of(undefined);
      }),
    );
  }

  // ── Recuperación — paso 1 ─────────────────────────────────────────────────
  forgotPassword(email: string): Observable<AuthResult<void>> {
    const body: ForgotPasswordRequest = { email };
    return this.http.post<void>(`${this.base}/api/auth/forgot-password`, body).pipe(
      map(() => ({ data: undefined })),
      catchError((err: HttpErrorResponse) => [this.mapHttpError(err)]),
    );
  }

  // ── Recuperación — paso 2 ─────────────────────────────────────────────────
  verifyCode(email: string, code: string): Observable<AuthResult<void>> {
    const body: VerifyCodeRequest = { email, code };
    return this.http.post<void>(`${this.base}/api/auth/verify-code`, body).pipe(
      map(() => ({ data: undefined })),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 400) return [{ error: 'INVALID_CODE' as AuthError }];
        return [this.mapHttpError(err)];
      }),
    );
  }

  // ── Recuperación — paso 3 ─────────────────────────────────────────────────
  resetPassword(email: string, code: string, newPassword: string): Observable<AuthResult<void>> {
    const body: ResetPasswordRequest = { email, code, newPassword };
    return this.http.post<void>(`${this.base}/api/auth/reset-password`, body).pipe(
      map(() => ({ data: undefined })),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 400) return [{ error: 'INVALID_CODE' as AuthError }];
        return [this.mapHttpError(err)];
      }),
    );
  }

  // ── Registro (admin) ──────────────────────────────────────────────────────
  createUser(
    email: string,
    password: string,
    apiKey: string,
  ): Observable<AuthResult<CreateUserResponse>> {
    const body: CreateUserRequest = { email, password };
    const headers = new HttpHeaders({ 'X-Admin-Api-Key': apiKey });
    return this.http
      .post<CreateUserResponse>(`${this.base}/api/admin/users`, body, { headers })
      .pipe(
        map((res) => ({ data: res })),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) return [{ error: 'INVALID_API_KEY' as AuthError }];
          if (err.status === 409) return [{ error: 'EMAIL_TAKEN' as AuthError }];
          return [this.mapHttpError(err)];
        }),
      );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private setSession(email: string): void {
    this._userEmail.set(email);
    localStorage.setItem(SESSION_KEY, email);
  }

  private clearSession(): void {
    this._userEmail.set(null);
    localStorage.removeItem(SESSION_KEY);
  }

  private mapHttpError(err: HttpErrorResponse): AuthResult<never> {
    if (err.status === 0) return { error: 'NETWORK_ERROR' };
    return { error: 'SERVER_ERROR' };
  }

  me(): Observable<AuthResult<LoginResponse>> {
    return this.sessionReady$.pipe(
      map((ok) =>
        ok
          ? { data: { email: this._userEmail()! } as LoginResponse }
          : { error: 'INVALID_CREDENTIALS' as AuthError },
      ),
    );
  }
}
