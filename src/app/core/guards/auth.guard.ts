import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (_route, _state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Espera a que me() resuelva antes de evaluar isAuthenticated().
  // Si el usuario refresca la página, sessionReady$ hace el GET /me
  // primero y solo entonces el guard decide. Como tiene shareReplay(1),
  // si ya resolvió (login dentro de la misma sesión SPA) emite
  // inmediatamente sin hacer un nuevo request.
  return auth.sessionReady$.pipe(
    map(() => {
      if (auth.isAuthenticated()) return true;
      return router.createUrlTree(['/login']);
    }),
  );
};


