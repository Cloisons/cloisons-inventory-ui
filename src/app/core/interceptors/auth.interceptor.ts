import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  console.log('🚀 AuthInterceptor: Intercepting request to:', req.url);
  const isLoginRequest = req.url.includes('/auth/signin');
  
  // Get the auth token from the service
  const token = authService.getToken();

  // Clone the request and add the authorization header if token exists
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Debug logging to verify token is being sent
    console.log('🔐 AuthInterceptor: Adding token to request');
    console.log('📍 Request URL:', req.url);
    console.log('🔑 Authorization Header:', `Bearer ${token.substring(0, 20)}...`);
    console.log('📋 All Headers:', req.headers.keys());
  } else {
    console.warn('⚠️ AuthInterceptor: No token found for request:', req.url);
    console.warn('⚠️ AuthInterceptor: Available localStorage keys:', Object.keys(localStorage));
  }

  // Handle the request and catch errors
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Special handling for login failures (wrong credentials should NOT trigger logout toast)
      if (error.status === 401 && isLoginRequest) {
        // Let the communication layer surface the error toast to avoid duplicates
        return throwError(() => error);
      }

      // Show toast message for any non-200 status (generic handler)
      if (error.status !== 200) {
        handleErrorResponse(error, toastService);
      }

      if (error.status === 401) {
        // Only logout on 401 if user was actually authenticated
        if (authService.isAuthenticated()) {
          authService.logout();
          router.navigate(['/login']);
        }
      }
      
      return throwError(() => error);
    })
  );
};

function handleErrorResponse(error: HttpErrorResponse, toastService: ToastService): void {
  let message = 'An error occurred';
  let title = 'Error';

  // Handle different error types
  if (error.error && typeof error.error === 'object') {
    if (error.error.message) {
      message = error.error.message;
    } else if (error.error.error) {
      message = error.error.error;
    }
  } else if (typeof error.error === 'string') {
    message = error.error;
  }

  // Set appropriate title based on status code
  switch (error.status) {
    case 400:
      title = 'Bad Request';
      break;
    case 401:
      title = 'Unauthorized';
      message = 'Your session has expired. Please log in again.';
      break;
    case 403:
      title = 'Forbidden';
      message = 'You do not have permission to perform this action.';
      break;
    case 404:
      title = 'Not Found';
      message = 'The requested resource was not found.';
      break;
    case 422:
      title = 'Validation Error';
      break;
    case 500:
      title = 'Server Error';
      message = 'An internal server error occurred. Please try again later.';
      break;
    case 502:
    case 503:
    case 504:
      title = 'Service Unavailable';
      message = 'The service is temporarily unavailable. Please try again later.';
      break;
    default:
      title = `Error ${error.status}`;
  }

  // toastService.error(message, title);
}
