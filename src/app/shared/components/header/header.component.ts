import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../../core/services/auth.service';
import { UserInfoComponent } from '../../../core/components/user-info/user-info.component';
import { NotificationComponent } from '../../../core/components/notification/notification.component';
import { MessageComponent } from '../../../core/components/message/message.component';
import { Notification } from '../../../core/services/notification.service';
import { Message } from '../../../core/services/message.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, UserInfoComponent, NotificationComponent, MessageComponent],
  template: `
    <nav class="navbar">
      <div class="navbar-menu-wrapper">
        <div class="navbar-brand-wrapper">
        <div class="logo-sm-view">
          <img src="assets/images/login-logo.png" alt="logo" />
        </div>
          <button 
            class="navbar-toggler navbar-toggler align-self-center mr-2" 
            type="button" 
            (click)="onToggleSidebar()"
            aria-label="Toggle sidebar">
            <i class="mdi mdi-menu"></i>
          </button>
        </div>
        <ul class="navbar-nav">
          <li class="nav-item dropdown">
            <app-notification 
              (notificationClick)="onNotificationClick($event)"
              (viewAll)="onViewAllNotifications()">
            </app-notification>
          </li>
          <li class="nav-item dropdown message-dropdown">
            <app-message 
              (messageClick)="onMessageClick($event)"
              (viewAll)="onViewAllMessages()">
            </app-message>
          </li>
        </ul>
        <ul class="navbar-nav navbar-nav-right">
          <li class="nav-item nav-profile dropdown border-0">
            <app-user-info (logout)="onLogout()"></app-user-info>
          </li>
        </ul>
      </div>
    </nav>
  `,
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() pageTitle: string = 'Dashboard';
  @Output() logout = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<Notification>();
  @Output() messageClick = new EventEmitter<Message>();
  @Output() viewAllNotifications = new EventEmitter<void>();
  @Output() viewAllMessages = new EventEmitter<void>();
  
  currentUser: User | null = null;

  constructor(
    private authService: AuthService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    // No initialization needed for search functionality
  }

  ngOnDestroy(): void {
    // No cleanup needed for search functionality
  }

  onLogout(): void {
    this.logout.emit();
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }


  onNotificationClick(notification: Notification): void {
    this.notificationClick.emit(notification);
  }

  onMessageClick(message: Message): void {
    this.messageClick.emit(message);
  }

  onViewAllNotifications(): void {
    this.viewAllNotifications.emit();
  }

  onViewAllMessages(): void {
    this.viewAllMessages.emit();
  }
}