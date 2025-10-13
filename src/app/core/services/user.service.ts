import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isLocked?: boolean;
  failedAttempts?: number;
  lockUntil?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserListResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

export interface UpdateUserPasswordRequest {
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  // Get all users with pagination and search
  getUsers(page: number = 1, limit: number = 10, search: string = ''): Observable<UserListResponse> {
    const params: any = { page: page.toString(), limit: limit.toString() };
    if (search) {
      params.search = search;
    }
    return this.http.get<UserListResponse>(`${this.apiUrl}/users`, { params });
  }

  // Get user by ID
  getUserById(userId: string): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/users/${userId}`);
  }

  // Create new user
  createUser(userData: CreateUserRequest): Observable<{ user: User }> {
    return this.http.post<{ user: User }>(`${this.apiUrl}/users`, userData);
  }

  // Update user
  updateUser(userId: string, userData: UpdateUserRequest): Observable<{ user: User }> {
    return this.http.put<{ user: User }>(`${this.apiUrl}/users/${userId}`, userData);
  }

  // Update user password
  updateUserPassword(userId: string, passwordData: UpdateUserPasswordRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/password`, passwordData);
  }

  // Delete user
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }

  // Get users by role (for backward compatibility)
  getUsersByRole(role: string): Observable<User[]> {
    return new Observable(observer => {
      this.getUsers(1, 1000).subscribe({
        next: (response) => {
          const users = response.users.filter(u => u.role === role);
          observer.next(users);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  // Lock user account
  lockUser(userId: string): Observable<{ user: User }> {
    return this.http.post<{ user: User }>(`${this.apiUrl}/users/${userId}/lock`, {});
  }

  // Unlock user account
  unlockUser(userId: string): Observable<{ user: User }> {
    return this.http.post<{ user: User }>(`${this.apiUrl}/users/${userId}/unlock`, {});
  }
}
