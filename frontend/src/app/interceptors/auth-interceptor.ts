import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (typeof window === 'undefined') {
    return next(req);
  }

  const token = localStorage.getItem('token');

  const isAuthRequest =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register');

  if (!token || isAuthRequest) {
    return next(req);
  }

  const clonedRequest = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });

  return next(clonedRequest);
};