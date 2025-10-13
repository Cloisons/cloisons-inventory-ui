import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, map, catchError, throwError, of } from 'rxjs';
import { CommunicationService } from './communication.service';
import { ToastService } from './toast.service';
import { AuthService } from './auth.service';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  actionUrl?: string;
  actionText?: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data?: Notification[];
}

export interface MarkAsReadRequest {
  notificationIds: string[];
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  userId: string;
  actionUrl?: string;
  actionText?: string;
}

export interface UpdateNotificationRequest {
  title?: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  actionText?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    info: { total: number; unread: number };
    success: { total: number; unread: number };
    warning: { total: number; unread: number };
    error: { total: number; unread: number };
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly API_BASE_URL = '/notifications';
  
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private pollingInterval: any;
  private readonly POLLING_INTERVAL = 300000; // 5 minutes
  private isPollingActive = false;
  private isAuthenticated = false;

  constructor(
    private communicationService: CommunicationService,
    private toastService: ToastService,
    private authService: AuthService
  ) {
    // React to authentication state
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      if (isAuth) {
        this.startPolling();
      } else {
        this.stopPolling();
        this.notificationsSubject.next([]);
        this.updateUnreadCount([]);
      }
    });
  }

  // Get all notifications
  getNotifications(): Observable<Notification[]> {
    if (!this.isAuthenticated) {
      return of([]);
    }
    console.log('🔔 NotificationService: Getting notifications from:', this.API_BASE_URL);
    console.log('🔔 NotificationService: Full URL will be:', `${this.communicationService['API_BASE_URL']}/${this.API_BASE_URL}`);
    
    return this.communicationService.get<NotificationResponse | Notification[]>(this.API_BASE_URL, 'Loading notifications...')
      .pipe(
        map((response: any) => {
          // Accept both wrapped and direct array
          if (Array.isArray(response)) {
            return response as Notification[];
          }
          if (response && typeof response === 'object') {
            const isWrapped = Object.prototype.hasOwnProperty.call(response, 'success') || Object.prototype.hasOwnProperty.call(response, 'data');
            const data = isWrapped ? (response.data || []) : response;
            return Array.isArray(data) ? data as Notification[] : [];
          }
          return [] as Notification[];
        }),
        tap(notifications => {
          this.notificationsSubject.next(notifications);
          this.updateUnreadCount(notifications);
        }),
        catchError(error => {
          console.error('Error loading notifications:', error);
          this.toastService.error('Failed to load notifications', 'Error');
          return throwError(() => error);
        })
      );
  }

  // Start polling for notifications
  private startPolling(): void {
    if (this.isPollingActive) return;
    if (!this.isAuthenticated) return;

    this.isPollingActive = true;
    // Load notifications immediately
    this.loadNotifications();

    // Set up polling interval
    this.pollingInterval = setInterval(() => {
      this.loadNotifications();
    }, this.POLLING_INTERVAL);
  }

  // Stop polling
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPollingActive = false;
  }

  // Load notifications
  private loadNotifications(): void {
    if (!this.isAuthenticated) return;
    this.getNotifications().subscribe();
  }

  // Mark notifications as read
  markAsRead(notificationIds: string[]): Observable<any> {
    if (!this.isAuthenticated) {
      return of(null);
    }
    const request: MarkAsReadRequest = { notificationIds };
    
    return this.communicationService.patch<any>(
      `${this.API_BASE_URL}/mark-read`, 
      request, 
      'Marking as read...'
    ).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(notification => 
          notificationIds.includes(notification._id) 
            ? { ...notification, isRead: true }
            : notification
        );
        this.notificationsSubject.next(updatedNotifications);
        this.updateUnreadCount(updatedNotifications);
        this.toastService.success('Notifications marked as read', 'Success');
      }),
      catchError(error => {
        console.error('Error marking notifications as read:', error);
        this.toastService.error('Failed to mark notifications as read', 'Error');
        return throwError(() => error);
      })
    );
  }

  // Mark all notifications as read
  markAllAsRead(): Observable<any> {
    if (!this.isAuthenticated) {
      return of(null);
    }
    return this.communicationService.patch<any>(
      `${this.API_BASE_URL}/mark-all-read`, 
      {}, 
      'Marking all as read...'
    ).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(notification => 
          ({ ...notification, isRead: true })
        );
        this.notificationsSubject.next(updatedNotifications);
        this.updateUnreadCount(updatedNotifications);
        this.toastService.success('All notifications marked as read', 'Success');
      }),
      catchError(error => {
        console.error('Error marking all notifications as read:', error);
        this.toastService.error('Failed to mark all notifications as read', 'Error');
        return throwError(() => error);
      })
    );
  }


  // Get unread count
  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  // Get current notifications
  getCurrentNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  // Update unread count
  private updateUnreadCount(notifications: Notification[]): void {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // Refresh notifications manually
  refreshNotifications(): void {
    this.loadNotifications();
  }

  // Cleanup polling when service is destroyed
  ngOnDestroy(): void {
    this.stopPolling();
  }
}
