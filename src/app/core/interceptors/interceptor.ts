import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo mandamos credenciales (cookies/sesión) a nuestro propio backend
  const esBackendPropio = req.url.startsWith(environment.apiUrl);

  const reqFinal = esBackendPropio ? req.clone({ withCredentials: true }) : req;

  return next(reqFinal);
};
