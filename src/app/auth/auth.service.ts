import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface AuthResponse {
  token: string;
}

export interface UserInfo {
  username: string;
  authenticated: boolean;
}

export interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: AuthState = {
  token: null,
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

  getToken(): string | null {
    return this.state$.value.token;
  }

  getCurrentUser(): UserInfo | null {
    return this.state$.value.user;
  }

  login(username: string, password: string): Observable<void> {
    this.setState({ loading: true, error: null });
    return this.http
      .post<AuthResponse>('/api/auth/login', { username, password })
      .pipe(
        tap((response) => {
          this.setToken(response.token);
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
    this.clearAuth();
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

  private setToken(token: string): void {
    localStorage.setItem('hivehub_token', token);
    this.setState({
      token,
      isAuthenticated: true
    });
  }

  private clearAuth(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.setState(INITIAL_STATE);
  }

  private hydrateState(): void {
    const token = localStorage.getItem('hivehub_token');
    if (token) {
      this.setState({ token, isAuthenticated: true });
    }
  }

  private getInitialState(): AuthState {
    const token = localStorage.getItem('hivehub_token');
    return {
      ...INITIAL_STATE,
      token: token || null,
      isAuthenticated: !!token
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
