import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Igual que authGuard: espera a que sessionReady$ resuelva antes de
  // decidir. Sin esto, en un refresh el signal todavía es null aunque
  // la cookie sea válida, y el guard deja entrar al login.
  return auth.sessionReady$.pipe(
    map(() => {
      if (!auth.isAuthenticated()) return true;
      return router.createUrlTree(['/mapa']);
    }),
  );
};


