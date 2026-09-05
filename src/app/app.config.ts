import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  inject,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/interceptor';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    // El initializer suscribe sessionReady$ para que el observable
    // se "caliente" al arrancar la app. Como sessionReady$ tiene
    // shareReplay(1), cuando los guards lo suscriban van a recibir
    // el resultado cacheado inmediatamente — sin hacer un nuevo request.
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return firstValueFrom(authService.sessionReady$).catch(() => undefined);
    }),
  ],
};

