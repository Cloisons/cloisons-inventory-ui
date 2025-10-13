import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User, UserListResponse } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;
  pageRange: number[] = [];
  query = '';
  isLoading = false;
  isSearching = false;
  errorMessage = '';
  isSuperAdmin = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    // Check if current user is super admin
    this.authService.currentUser$.subscribe(user => {
      this.isSuperAdmin = user ? this.authService.hasRole('superAdmin') : false;
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.userService.getUsers(this.page, this.limit, this.query).subscribe({
      next: (response: UserListResponse) => {
        this.users = response.users;
        this.totalPages = response.pagination.totalPages;
        this.total = response.pagination.totalItems;
        this.pageRange = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.users = [];
        this.errorMessage = err?.message || 'Failed to load users';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearchInput(_: Event): void {
    this.page = 1;
    this.load();
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.page = 1;
      this.load();
    }
  }

  clearSearch(): void {
    this.query = '';
    this.page = 1;
    this.load();
  }

  goTo(target: number): void {
    if (target < 1 || target > this.totalPages) return;
    this.page = target;
    this.load();
  }

  onDelete(user: User): void {
    if (!confirm(`Delete user "${user.firstName} ${user.lastName}"?`)) return;
    this.userService.deleteUser(user._id).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.errorMessage = err?.message || 'Failed to delete user';
        this.cdr.markForCheck();
      }
    });
  }

  onLock(user: User): void {
    if (!confirm(`Lock user account "${user.firstName} ${user.lastName}"?`)) return;
    this.userService.lockUser(user._id).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.errorMessage = err?.message || 'Failed to lock user account';
        this.cdr.markForCheck();
      }
    });
  }

  onUnlock(user: User): void {
    if (!confirm(`Unlock user account "${user.firstName} ${user.lastName}"?`)) return;
    this.userService.unlockUser(user._id).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.errorMessage = err?.message || 'Failed to unlock user account';
        this.cdr.markForCheck();
      }
    });
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'superAdmin':
        return 'Super Admin';
      case 'user1':
        return 'User 1';
      case 'user2':
        return 'User 2';
      case 'user': // Legacy role support
        return 'User 1 (Legacy)';
      default:
        return role;
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'superAdmin':
        return 'badge-danger';
      case 'user1':
        return 'badge-primary';
      case 'user2':
        return 'badge-info';
      case 'user': // Legacy role support
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  getStatusBadgeClass(user: User): string {
    if (user.role === 'superAdmin') {
      return 'badge-success';
    }
    return user.isLocked ? 'badge-danger' : 'badge-success';
  }

  getStatusIcon(user: User): string {
    if (user.role === 'superAdmin') {
      return 'mdi-shield-check';
    }
    return user.isLocked ? 'mdi-lock' : 'mdi-lock-open';
  }

  getStatusText(user: User): string {
    if (user.role === 'superAdmin') {
      return 'Protected';
    }
    return user.isLocked ? 'Locked' : 'Active';
  }

  trackById(_: number, user: User): string { 
    return user._id; 
  }
  
  trackByPageNumber(_: number, p: number): number { 
    return p; 
  }
  
  getMin(a: number, b: number): number { 
    return a < b ? a : b; 
  }
}
