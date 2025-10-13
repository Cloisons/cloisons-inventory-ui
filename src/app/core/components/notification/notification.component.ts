import { Component, OnInit, Output, EventEmitter, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-dropdown" *ngIf="notifications.length > 0">
      <a class="nav-link count-indicator dropdown-toggle" id="notificationDropdown" href="#" (click)="toggleNotificationDropdown($event)">
        <i class="mdi mdi-bell-outline"></i>
        <span class="count count-varient1" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
      </a>
      <div 
        class="dropdown-menu navbar-dropdown navbar-dropdown-large preview-list" 
        aria-labelledby="notificationDropdown" 
        [class.show]="isNotificationDropdownOpen"
      >
        <div class="dropdown-header d-flex justify-content-between align-items-center">
          <h6 class="mb-0">Notifications</h6>
          <button 
            class="btn btn-sm btn-outline-primary" 
            (click)="markAllAsRead($event)"
            *ngIf="unreadCount > 0"
            [disabled]="isMarkingAsRead"
          >
            {{ isMarkingAsRead ? 'Marking...' : 'Mark All Read' }}
          </button>
        </div>
        
        <div class="notification-list" style="max-height: 400px; overflow-y: auto;">
          <div 
            class="dropdown-item preview-item" 
            *ngFor="let notification of notifications; trackBy: trackByNotificationId"
            [class.unread]="!notification.isRead"
            (click)="onNotificationClick(notification, $event)"
          >
            <div class="preview-item-content">
              <div class="d-flex align-items-start">
                <div class="notification-icon mr-2">
                  <i [class]="getNotificationIcon(notification.type)"></i>
                </div>
                <div class="flex-grow-1">
                  <p class="mb-1 font-weight-medium">{{ notification.title }}</p>
                  <p class="text-small text-muted mb-1">{{ notification.message }}</p>
                  <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">{{ formatDate(notification.createdAt) }}</small>
                    <span class="badge badge-sm" [class]="getTypeBadgeClass(notification.type)">
                      {{ notification.type }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="text-center p-3" *ngIf="notifications.length === 0">
            <i class="mdi mdi-bell-off text-muted" style="font-size: 2rem;"></i>
            <p class="text-muted mb-0">No notifications</p>
          </div>
        </div>
        
        <div class="dropdown-divider"></div>
        <div class="dropdown-footer text-center">
          <a href="#" class="text-primary" (click)="viewAllNotifications($event)">View all notifications</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-dropdown {
      position: relative;
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

    .count {
      position: absolute;
      top: -2px;
      right: -2px;
      background-color: #dc3545;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      z-index: 1000;
      min-width: 350px;
      max-width: 400px;
      padding: 0;
      margin: 2px 0 0;
      background-color: #fff;
      border: 1px solid rgba(0,0,0,.15);
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,.15);
      display: none;
    }

    .dropdown-menu.show {
      display: block;
    }

    .dropdown-header {
      padding: 12px 16px;
      border-bottom: 1px solid #e9ecef;
      background-color: #f8f9fa;
      border-radius: 8px 8px 0 0;
    }

    .notification-list {
      padding: 0;
    }

    .preview-item {
      display: block;
      width: 100%;
      padding: 12px 16px;
      border-bottom: 1px solid #f1f3f4;
      text-decoration: none;
      color: #333;
      transition: background-color 0.2s;
      cursor: pointer;
    }

    .preview-item:hover {
      background-color: #f8f9fa;
      color: #333;
    }

    .preview-item.unread {
      background-color: #e3f2fd;
      border-left: 3px solid #2196f3;
    }

    .preview-item:last-child {
      border-bottom: none;
    }

    .notification-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: #f8f9fa;
    }

    .notification-icon i {
      font-size: 16px;
    }

    .notification-icon .mdi-info {
      color: #17a2b8;
    }

    .notification-icon .mdi-check-circle {
      color: #28a745;
    }

    .notification-icon .mdi-alert {
      color: #ffc107;
    }

    .notification-icon .mdi-alert-circle {
      color: #dc3545;
    }

    .badge {
      font-size: 10px;
      padding: 2px 6px;
    }

    .badge-info {
      background-color: #17a2b8;
    }

    .badge-success {
      background-color: #28a745;
    }

    .badge-warning {
      background-color: #ffc107;
      color: #212529;
    }

    .badge-danger {
      background-color: #dc3545;
    }

    .dropdown-footer {
      padding: 12px 16px;
      background-color: #f8f9fa;
      border-radius: 0 0 8px 8px;
    }

    .dropdown-footer a {
      color: #007bff;
      text-decoration: none;
    }

    .dropdown-footer a:hover {
      text-decoration: underline;
    }

    .btn-sm {
      padding: 2px 6px;
      font-size: 10px;
    }

    .mdi-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  @Output() notificationClick = new EventEmitter<Notification>();
  @Output() viewAll = new EventEmitter<void>();
  
  notifications: Notification[] = [];
  unreadCount: number = 0;
  isNotificationDropdownOpen: boolean = false;
  isMarkingAsRead: boolean = false;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to notifications
    this.subscriptions.add(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
      })
    );

    // Subscribe to unread count
    this.subscriptions.add(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleNotificationDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isNotificationDropdownOpen = !this.isNotificationDropdownOpen;
    
    if (this.isNotificationDropdownOpen) {
      this.notificationService.refreshNotifications();
    }
  }

  onNotificationClick(notification: Notification, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Mark as read if not already read
    if (!notification.isRead) {
      this.notificationService.markAsRead([notification._id]).subscribe();
    }
    
    this.notificationClick.emit(notification);
    this.isNotificationDropdownOpen = false;
  }

  markAllAsRead(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.unreadCount === 0) return;
    
    this.isMarkingAsRead = true;
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.isMarkingAsRead = false;
      },
      error: () => {
        this.isMarkingAsRead = false;
      }
    });
  }


  viewAllNotifications(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.viewAll.emit();
    this.isNotificationDropdownOpen = false;
  }

  closeDropdown(): void {
    this.isNotificationDropdownOpen = false;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'info':
        return 'mdi mdi-information';
      case 'success':
        return 'mdi mdi-check-circle';
      case 'warning':
        return 'mdi mdi-alert';
      case 'error':
        return 'mdi mdi-alert-circle';
      default:
        return 'mdi mdi-bell';
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'info':
        return 'badge-info';
      case 'success':
        return 'badge-success';
      case 'warning':
        return 'badge-warning';
      case 'error':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  formatDate(date: Date | string): string {
    const notificationDate = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification._id;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const isNotificationDropdown = target.closest('.notification-dropdown');
    
    // Close dropdown if clicking outside the notification component
    if (!isNotificationDropdown && this.isNotificationDropdownOpen) {
      this.closeDropdown();
    }
  }

  // Debug method to check token status
  debugTokenAndNotifications(): void {
    console.log('🔍 Notification Component Debug:');
    this.authService.debugTokenStatus();
    console.log('🔔 Current notifications:', this.notifications);
    console.log('🔔 Unread count:', this.unreadCount);
  }
}
