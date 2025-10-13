import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SideNavComponent, NavItem } from '../side-nav/side-nav.component';
import { HeaderComponent } from '../header/header.component';
import { AuthService, User } from '../../../core/services/auth.service';
import { Notification } from '../../../core/services/notification.service';
import { Message } from '../../../core/services/message.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, SideNavComponent, HeaderComponent],
  template: `
    <div class="layout-container">
      <app-side-nav 
        [isExpanded]="isSideNavExpanded"
        [navItems]="navItems"
        (itemClick)="onNavItemClick($event)"
        role="navigation"
        aria-label="Main navigation"
      ></app-side-nav>
      
      <div class="main-content" [class.side-nav-expanded]="isSideNavExpanded">
        <app-header 
          [pageTitle]="pageTitle"
          (logout)="onLogout()"
          (toggleSidebar)="onToggleSideNav()"
          (notificationClick)="onNotificationClick($event)"
          (messageClick)="onMessageClick($event)"
          (viewAllNotifications)="onViewAllNotifications()"
          (viewAllMessages)="onViewAllMessages()"
        ></app-header>
        
        <main class="content" role="main">
          <ng-content></ng-content>
        </main>
      </div>
    </div>
  `,
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent {
  @Input() pageTitle: string = 'Dashboard';
  @Input() navItems: NavItem[] = [];
  @Output() navItemClick = new EventEmitter<NavItem>();
  @Output() notificationClick = new EventEmitter<Notification>();
  @Output() messageClick = new EventEmitter<Message>();
  @Output() viewAllNotifications = new EventEmitter<void>();
  @Output() viewAllMessages = new EventEmitter<void>();

  isSideNavExpanded = false; // Start collapsed to match reference
  currentUser: User | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
      this.cdr.markForCheck();
    });
  }

  onToggleSideNav(): void {
    this.isSideNavExpanded = !this.isSideNavExpanded;
  }

  onNavItemClick(item: NavItem): void {
    this.navItemClick.emit(item);
  }

  onLogout(): void {
    this.authService.logout();
  }


  onNotificationClick(notification: Notification): void {
    console.log('Notification clicked:', notification);
    this.notificationClick.emit(notification);
    // You can add navigation logic here, e.g., router.navigate(['/notifications', notification.id])
  }

  onMessageClick(message: Message): void {
    console.log('Message clicked:', message);
    this.messageClick.emit(message);
    // You can add navigation logic here, e.g., router.navigate(['/messages', message.id])
  }

  onViewAllNotifications(): void {
    console.log('View all notifications clicked');
    this.viewAllNotifications.emit();
    // You can add navigation logic here, e.g., router.navigate(['/notifications'])
  }

  onViewAllMessages(): void {
    console.log('View all messages clicked');
    this.viewAllMessages.emit();
    // You can add navigation logic here, e.g., router.navigate(['/messages'])
  }
}
