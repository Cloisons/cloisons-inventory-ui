import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';
import { CommunicationService } from './communication.service';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastService: ToastService,
    private communicationService: CommunicationService
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getUser();
    
    if (token && user) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.communicationService.post<LoginResponse>(
      '/auth/signin', 
      credentials, 
      'Signing in...'
    ).pipe(
      tap((response: any) => {
        // Support both wrapped ({ success, message, data }) and unwrapped ({ token, user }) responses
        const data = response?.data ?? response;
        if (data?.token && data?.user) {
          this.setToken(data.token);
          this.setUser(data.user);
          this.currentUserSubject.next(data.user);
          this.isAuthenticatedSubject.next(true);
          this.toastService.success('Login successful!', 'Welcome');
        }
      })
    );
  }

  logout(): void {
    this.clearAuthData();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.toastService.info('You have been logged out successfully.', 'Logout');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      console.log('🔑 AuthService: Token retrieved from localStorage');
      console.log('🔑 Token preview:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ AuthService: No token found in localStorage');
    }
    return token;
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Debug method to check token status
  debugTokenStatus(): void {
    console.log('🔍 AuthService Debug:');
    console.log('🔑 Token Key:', this.TOKEN_KEY);
    console.log('🔑 Token exists:', !!this.getToken());
    console.log('🔑 Token value:', this.getToken());
    console.log('👤 User exists:', !!this.getUser());
    console.log('👤 User value:', this.getUser());
    console.log('🔐 Is authenticated:', this.isAuthenticatedSubject.value);
    console.log('📦 All localStorage keys:', Object.keys(localStorage));
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Method to refresh token if needed
  refreshToken(): Observable<any> {
    return this.communicationService.post('/auth/refresh', {
      token: this.getToken()
    }, 'Refreshing token...');
  }

  // Method to validate token
  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return new Observable(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    return this.communicationService.get<{valid: boolean}>('/auth/validate', 'Validating token...')
      .pipe(
        map(response => response.valid),
        tap(isValid => {
          if (!isValid) {
            this.logout();
          }
        })
      );
  }
}
