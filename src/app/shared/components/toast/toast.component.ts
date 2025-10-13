import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="region" aria-live="polite" aria-label="Notifications">
      <div 
        *ngFor="let toast of toasts; trackBy: trackByToastId" 
        class="toast"
        [ngClass]="'toast-' + toast.type"
        (click)="onToastClick(toast.id)"
        role="alert"
        [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'"
      >
        <div class="toast-content">
          <div class="toast-icon">
            <i [ngClass]="getIconClass(toast.type)" aria-hidden="true"></i>
          </div>
          <div class="toast-body">
            <div class="toast-title" *ngIf="toast.title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button 
            class="toast-close" 
            (click)="onCloseClick(toast.id, $event)"
            aria-label="Close notification"
            type="button"
          >
            <i class="mdi mdi-close" aria-hidden="true"></i>
          </button>
        </div>
        <div class="toast-progress" *ngIf="toast.duration && toast.duration > 0">
          <div class="toast-progress-bar" [style.animation-duration]="toast.duration + 'ms'"></div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent {
  @Input() toasts: ToastMessage[] = [];
  @Output() dismiss = new EventEmitter<string>();

  onToastClick(toastId: string): void {
    // Optional: Add click behavior if needed
  }

  onCloseClick(toastId: string, event: Event): void {
    event.stopPropagation();
    this.dismiss.emit(toastId);
  }

  trackByToastId(index: number, toast: ToastMessage): string {
    return toast.id;
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'success':
        return 'mdi mdi-check-circle';
      case 'error':
        return 'mdi mdi-alert-circle';
      case 'warning':
        return 'mdi mdi-alert';
      case 'info':
        return 'mdi mdi-information';
      default:
        return 'mdi mdi-information';
    }
  }
}
