import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('AuthGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    // Creamos mocks para no instanciar los servicios reales
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('debería permitir el acceso (retornar true) si el usuario está autenticado', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    
    // Simulamos la ejecución del guard
    const result = TestBed.runInInjectionContext(() => {
      return AuthGuard(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      );
    });

    expect(result).toBeTrue();
  });

  it('debería bloquear el acceso y redirigir a /login si NO está autenticado', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    
    const mockState = { url: '/apiarios' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => {
      return AuthGuard(
        {} as ActivatedRouteSnapshot,
        mockState
      );
    });

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/apiarios' } });
  });
});
