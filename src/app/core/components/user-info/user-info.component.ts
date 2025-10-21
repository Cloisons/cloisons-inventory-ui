import { Component, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="user-info nav-profile dropdown border-0" *ngIf="currentUser">
      <a class="nav-link dropdown-toggle" id="profileDropdown" href="#" (click)="toggleProfileDropdown($event)">
        <img class="nav-profile-img" alt="" src="assets/images/profile-icon.svg" width="48" height="48" />
        <span class="profile-name">Hello <b>{{ currentUser.firstName || 'User' }}</b></span>
      </a>
      <div 
        class="dropdown-menu navbar-dropdown w-100" 
        aria-labelledby="profileDropdown" 
        [class.show]="isProfileDropdownOpen"
      >
        <a class="dropdown-item" routerLink="/profile">
          <i class="mdi mdi-account-outline mr-2"></i> Profile
        </a>
        <a class="dropdown-item" href="#" (click)="onSignout($event)">
          <i class="mdi mdi-logout mr-2"></i> Signout
        </a>
      </div>
    </div>
  `,
  styles: [`
    .user-info {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: #333;
      padding: 8px 12px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .nav-link:hover {
      background-color: #f8f9fa;
      color: #333;
    }

    .nav-profile-img {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      object-fit: cover;
      background: #fff;
    }

    .profile-name {
      font-size: 16px;
      color: #333;
    }

    .profile-name b {
      font-weight: 600;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      z-index: 1000;
      min-width: 200px;
      padding: 8px 0;
      margin: 2px 0 0;
      background-color: #fff;
      border: 1px solid rgba(0,0,0,.15);
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,.1);
      display: none;
    }

    .dropdown-menu.show {
      display: block;
    }

    .dropdown-item {
      display: block;
      width: 100%;
      padding: 8px 16px;
      clear: both;
      font-weight: 400;
      color: #333;
      text-align: inherit;
      text-decoration: none;
      white-space: nowrap;
      background-color: transparent;
      border: 0;
      transition: background-color 0.2s;
    }

    .dropdown-item:hover {
      background-color: #f8f9fa;
      color: #333;
    }

    .dropdown-item i {
      margin-right: 8px;
      width: 16px;
    }
  `]
})
export class UserInfoComponent implements OnInit {
  @Output() logout = new EventEmitter<void>();
  
  currentUser: User | null = null;
  isProfileDropdownOpen: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
    });
  }

  toggleProfileDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    console.log('Profile dropdown clicked, current state:', this.isProfileDropdownOpen);
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
    console.log('Profile dropdown new state:', this.isProfileDropdownOpen);
  }

  onSignout(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.logout.emit();
    this.isProfileDropdownOpen = false;
  }

  closeDropdown(): void {
    this.isProfileDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const isDropdownToggle = target.closest('.dropdown-toggle');
    const isDropdownMenu = target.closest('.dropdown-menu');
    const isUserInfo = target.closest('.user-info');
    
    // Close dropdown if clicking outside the user info component
    if (!isUserInfo && this.isProfileDropdownOpen) {
      this.closeDropdown();
    }
  }
}
