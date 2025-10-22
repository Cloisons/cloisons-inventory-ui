import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SideNavComponent, NavItem } from '../side-nav/side-nav.component';
import { HeaderComponent } from '../header/header.component';
import { AuthService, User } from '../../../core/services/auth.service';
import { Notification } from '../../../core/services/notification.service';
import { Message } from '../../../core/services/message.service';
import { MobileDetectionService } from '../../../core/services/mobile-detection.service';
import { Subject, takeUntil } from 'rxjs';

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
export class LayoutComponent implements OnInit, OnDestroy {
  @Input() pageTitle: string = 'Dashboard';
  @Input() navItems: NavItem[] = [];
  @Output() navItemClick = new EventEmitter<NavItem>();
  @Output() notificationClick = new EventEmitter<Notification>();
  @Output() messageClick = new EventEmitter<Message>();
  @Output() viewAllNotifications = new EventEmitter<void>();
  @Output() viewAllMessages = new EventEmitter<void>();

  isSideNavExpanded = false; // Start collapsed to match reference
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private mobileDetectionService: MobileDetectionService,
    private cdr: ChangeDetectorRef
  ) {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    // Listen to mobile detection changes
    this.mobileDetectionService.isMobile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isMobile => {
        // Auto-collapse side menu when switching to mobile
        if (isMobile && this.isSideNavExpanded) {
          this.isSideNavExpanded = false;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onToggleSideNav(): void {
    this.isSideNavExpanded = !this.isSideNavExpanded;
  }

  onNavItemClick(item: NavItem): void {
    // Auto-close side menu on mobile when nav item is clicked
    if (this.mobileDetectionService.isMobile) {
      this.isSideNavExpanded = false;
    }
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
