import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    // Limpiamos el localStorage antes de cada test para no arrastrar estado
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verifica que no haya peticiones HTTP pendientes
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('debería inicializarse como autenticado si hivehub_session existe en localStorage', () => {
    localStorage.setItem('hivehub_session', 'true');
    // Para probar la inicialización real, lo instanciamos manualmente:
    const manualService = new AuthService(TestBed.inject(HttpClient));
    
    expect(manualService.isAuthenticated()).toBeTrue();
  });

  it('debería hacer POST a /api/auth/login y guardar sesión en success', () => {
    service.login('admin', 'password').subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'admin', password: 'password' });

    // Simulamos respuesta del backend
    req.flush({ username: 'admin' });

    expect(service.isAuthenticated()).toBeTrue();
    expect(localStorage.getItem('hivehub_session')).toBe('true');
  });

  it('debería manejar error en login y no autenticar', () => {
    service.login('admin', 'wrong').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
      }
    });

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ error: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('hivehub_session')).toBeNull();
  });

  it('debería hacer POST a /api/auth/logout y limpiar sesión localmente', () => {
    // Primero simulamos que está logueado
    localStorage.setItem('hivehub_session', 'true');
    const authService = new AuthService(TestBed.inject(HttpClient));
    expect(authService.isAuthenticated()).toBeTrue();

    // Hacemos logout
    authService.logout();

    // Verificamos que se limpie la sesión local ANTES de la respuesta
    expect(authService.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('hivehub_session')).toBeNull();

    // Verificamos la llamada HTTP
    const req = httpMock.expectOne('/api/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush(null); // Backend devuelve 204 No Content
  });
});
