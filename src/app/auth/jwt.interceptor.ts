import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

export const jwtInterceptorFn: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // Verificamos si la petición va a nuestro backend (relativa /api o absoluta hacia localhost:8080/hivehub)
  const isApiUrl = req.url.startsWith('/api') || req.url.includes('localhost:8080') || req.url.includes('/hivehub');

  if (isApiUrl) {
    req = req.clone({
      withCredentials: true
    });
  }
  
  return next(req);
};
