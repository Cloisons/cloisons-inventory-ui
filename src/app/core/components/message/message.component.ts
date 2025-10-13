import { Component, OnInit, Output, EventEmitter, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MessageService, Message } from '../../services/message.service';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="message-dropdown" *ngIf="messages.length > 0">
      <a class="nav-link count-indicator dropdown-toggle" id="messageDropdown" href="#" (click)="toggleMessageDropdown($event)">
        <i class="mdi mdi-email-outline"></i>
        <span class="count count-varient2" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
      </a>
      <div 
        class="dropdown-menu navbar-dropdown navbar-dropdown-large preview-list" 
        aria-labelledby="messageDropdown" 
        [class.show]="isMessageDropdownOpen"
      >
        <div class="dropdown-header d-flex justify-content-between align-items-center">
          <h6 class="mb-0">Messages</h6>
          <button 
            class="btn btn-sm btn-outline-primary" 
            (click)="markAllAsRead($event)"
            *ngIf="unreadCount > 0"
            [disabled]="isMarkingAsRead"
          >
            {{ isMarkingAsRead ? 'Marking...' : 'Mark All Read' }}
          </button>
        </div>
        
        <div class="message-list" style="max-height: 400px; overflow-y: auto;">
          <div 
            class="dropdown-item preview-item" 
            *ngFor="let message of messages; trackBy: trackByMessageId"
            [class.unread]="!message.isRead"
            (click)="onMessageClick(message, $event)"
          >
            <div class="preview-item-content d-flex align-items-start">
              <div class="message-avatar mr-2">
                <div class="avatar-circle">
                  {{ getInitials(message.senderName) }}
                </div>
              </div>
              <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <div class="sender-info">
                    <span class="font-weight-medium">{{ message.senderName }}</span>
                    <span class="badge badge-sm ml-1" [class]="getPriorityBadgeClass(message.priority)">
                      {{ message.priority }}
                    </span>
                  </div>
                  <small class="text-muted">{{ formatDate(message.createdAt) }}</small>
                </div>
                <p class="text-small text-muted ellipsis mb-1">{{ message.subject }}</p>
                <p class="text-small text-muted ellipsis mb-1">{{ message.content }}</p>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="badge badge-sm" [class]="getCategoryBadgeClass(message.category)">
                    {{ message.category }}
                  </span>
                  <button 
                    class="btn btn-sm btn-outline-danger" 
                    (click)="deleteMessage(message.id, $event)"
                    [disabled]="isDeleting === message.id"
                    title="Delete message"
                  >
                    <i class="mdi mdi-close" *ngIf="isDeleting !== message.id"></i>
                    <i class="mdi mdi-loading mdi-spin" *ngIf="isDeleting === message.id"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="text-center p-3" *ngIf="messages.length === 0">
            <i class="mdi mdi-email-outline text-muted" style="font-size: 2rem;"></i>
            <p class="text-muted mb-0">No messages</p>
          </div>
        </div>
        
        <div class="dropdown-divider"></div>
        <div class="dropdown-footer text-center">
          <a href="#" class="text-primary" (click)="viewAllMessages($event)">View all messages</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .message-dropdown {
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
      background-color: #28a745;
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

    .message-list {
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
      background-color: #e8f5e8;
      border-left: 3px solid #28a745;
    }

    .preview-item:last-child {
      border-bottom: none;
    }

    .message-avatar {
      flex-shrink: 0;
    }

    .avatar-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #007bff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }

    .sender-info {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .badge {
      font-size: 10px;
      padding: 2px 6px;
    }

    .badge-primary {
      background-color: #007bff;
    }

    .badge-success {
      background-color: #28a745;
    }

    .badge-warning {
      background-color: #ffc107;
      color: #212529;
    }

    .badge-info {
      background-color: #17a2b8;
    }

    .badge-danger {
      background-color: #dc3545;
    }

    .badge-secondary {
      background-color: #6c757d;
    }

    .ellipsis {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 200px;
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
export class MessageComponent implements OnInit, OnDestroy {
  @Output() messageClick = new EventEmitter<Message>();
  @Output() viewAll = new EventEmitter<void>();
  
  messages: Message[] = [];
  unreadCount: number = 0;
  isMessageDropdownOpen: boolean = false;
  isMarkingAsRead: boolean = false;
  isDeleting: string | null = null;
  
  private subscriptions: Subscription = new Subscription();

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    // Subscribe to messages
    this.subscriptions.add(
      this.messageService.messages$.subscribe(messages => {
        this.messages = messages;
      })
    );

    // Subscribe to unread count
    this.subscriptions.add(
      this.messageService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleMessageDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isMessageDropdownOpen = !this.isMessageDropdownOpen;
    
    if (this.isMessageDropdownOpen) {
      this.messageService.refreshMessages();
    }
  }

  onMessageClick(message: Message, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Mark as read if not already read
    if (!message.isRead) {
      this.messageService.markAsRead([message.id]).subscribe();
    }
    
    this.messageClick.emit(message);
    this.isMessageDropdownOpen = false;
  }

  markAllAsRead(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.unreadCount === 0) return;
    
    this.isMarkingAsRead = true;
    this.messageService.markAllAsRead().subscribe({
      next: () => {
        this.isMarkingAsRead = false;
      },
      error: () => {
        this.isMarkingAsRead = false;
      }
    });
  }

  deleteMessage(messageId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.isDeleting = messageId;
    this.messageService.deleteMessage(messageId).subscribe({
      next: () => {
        this.isDeleting = null;
      },
      error: () => {
        this.isDeleting = null;
      }
    });
  }

  viewAllMessages(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.viewAll.emit();
    this.isMessageDropdownOpen = false;
  }

  closeDropdown(): void {
    this.isMessageDropdownOpen = false;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getPriorityBadgeClass(priority: string): string {
    return this.messageService.getPriorityBadgeClass(priority);
  }

  getCategoryBadgeClass(category: string): string {
    return this.messageService.getCategoryBadgeClass(category);
  }

  formatDate(date: Date | string): string {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
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

  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const isMessageDropdown = target.closest('.message-dropdown');
    
    // Close dropdown if clicking outside the message component
    if (!isMessageDropdown && this.isMessageDropdownOpen) {
      this.closeDropdown();
    }
  }
}
