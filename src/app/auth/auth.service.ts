import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface AuthResponse {
  username?: string;
}

export interface UserInfo {
  username: string;
  authenticated: boolean;
}

export interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly state$ = new BehaviorSubject<AuthState>(this.getInitialState());

  constructor(private readonly http: HttpClient) {
    this.hydrateState();
  }

  getState(): Observable<AuthState> {
    return this.state$.asObservable();
  }

  isAuthenticated(): boolean {
    return this.state$.value.isAuthenticated;
  }

  getCurrentUser(): UserInfo | null {
    return this.state$.value.user;
  }

  login(username: string, password: string): Observable<void> {
    this.setState({ loading: true, error: null });
    return this.http
      .post<AuthResponse>('/api/auth/login', { username, password })
      .pipe(
        tap(() => {
          this.setSessionFlag();
          this.setState({ loading: false, user: { username, authenticated: true } });
        }),
        map(() => undefined),
        catchError((error) => {
          const errorMsg = this.extractErrorMessage(error);
          this.setState({ loading: false, error: errorMsg });
          throw error;
        })
      );
  }

  logout(): void {
    const wasAuthenticated = this.isAuthenticated();
    this.clearAuth();

    // Fire-and-forget: invalida la sesión en la BD y expira la cookie.
    // Si no hay red (offline), la cookie expirará sola por TTL (24h).
    if (wasAuthenticated) {
      this.http.post('/api/auth/logout', null).subscribe({
        error: () => { }
      });
    }
  }

  refreshUser(): Observable<UserInfo> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuario no autenticado');
    }
    return this.http.get<UserInfo>('/api/me').pipe(
      tap((user) => {
        this.setState({ user });
      }),
      catchError((error) => {
        if (error.status === 401) {
          this.clearAuth();
        }
        throw error;
      })
    );
  }

  private setSessionFlag(): void {
    localStorage.setItem('hivehub_session', 'true');
    this.setState({
      isAuthenticated: true
    });
  }

  private clearAuth(): void {
    localStorage.removeItem('hivehub_session');
    // Para no romper la experiencia offline que ya guardó este token, lo removemos también
    localStorage.removeItem('hivehub_token');
    sessionStorage.clear();
    this.setState(INITIAL_STATE);
  }

  private hydrateState(): void {
    // Soporte legacy por si alguien actualiza la app y aún tenía hivehub_token
    const session = localStorage.getItem('hivehub_session') || localStorage.getItem('hivehub_token');
    if (session) {
      this.setState({ isAuthenticated: true });
    }
  }

  private getInitialState(): AuthState {
    const session = localStorage.getItem('hivehub_session') || localStorage.getItem('hivehub_token');
    return {
      ...INITIAL_STATE,
      isAuthenticated: !!session
    };
  }

  private setState(partial: Partial<AuthState>): void {
    const current = this.state$.value;
    this.state$.next({ ...current, ...partial });
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No se puede conectar con el backend. Verifica que esté corriendo.';
      }
      if (error.status === 401) {
        return 'Credenciales inválidas. Verifica tu usuario y contraseña.';
      }
      if (error.error?.error) {
        return error.error.error;
      }
      return 'Ocurrió un error. Intenta nuevamente.';
    }
    return 'Ocurrió un error desconocido.';
  }
}
