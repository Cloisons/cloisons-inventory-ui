import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // in milliseconds, 0 means no auto-dismiss
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private defaultDuration = 5000; // 5 seconds

  constructor() {}

  show(message: string, type: ToastMessage['type'] = 'info', title: string = '', duration?: number): string {
    const id = this.generateId();
    const toast: ToastMessage = {
      id,
      type,
      title: title || this.getDefaultTitle(type),
      message,
      duration: duration !== undefined ? duration : this.defaultDuration
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    // Auto-dismiss if duration is set
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, toast.duration);
    }

    return id;
  }

  success(message: string, title: string = 'Success', duration?: number): string {
    return this.show(message, 'success', title, duration);
  }

  error(message: string, title: string = 'Error', duration?: number): string {
    return this.show(message, 'error', title, duration);
  }

  warning(message: string, title: string = 'Warning', duration?: number): string {
    return this.show(message, 'warning', title, duration);
  }

  info(message: string, title: string = 'Info', duration?: number): string {
    return this.show(message, 'info', title, duration);
  }

  dismiss(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(toast => toast.id !== id));
  }

  dismissAll(): void {
    this.toastsSubject.next([]);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getDefaultTitle(type: ToastMessage['type']): string {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Info';
      default:
        return 'Notification';
    }
  }
}
