import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, map, catchError, throwError, of } from 'rxjs';
import { CommunicationService } from './communication.service';
import { ToastService } from './toast.service';
import dummyApiResponses from './dummy-api-responses.json';

export interface Message {
  id: string;
  subject: string;
  content: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'support' | 'invoice' | 'project' | 'system';
  createdAt: string;
  updatedAt: string;
  attachments?: MessageAttachment[];
  replyToId?: string;
  threadId?: string;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
}

export interface MessageResponse {
  success: boolean;
  message: string;
  data?: Message[];
}

export interface SendMessageRequest {
  subject: string;
  content: string;
  recipientId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'support' | 'invoice' | 'project' | 'system';
  replyToId?: string;
  threadId?: string;
}

export interface MarkAsReadRequest {
  messageIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly API_BASE_URL = '/messages';
  
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private communicationService: CommunicationService,
    private toastService: ToastService
  ) {
    this.loadMessages();
  }

  // Get all messages
  getMessages(): Observable<Message[]> {
    // Use dummy data from JSON file
    const dummyResponse = dummyApiResponses.messages.getAll;
    const messages = (dummyResponse.data || []) as Message[];
    
    return of(messages).pipe(
      tap(messages => {
        this.messagesSubject.next(messages);
        this.updateUnreadCount(messages);
      }),
      catchError(error => {
        console.error('Error loading messages:', error);
        this.toastService.error('Failed to load messages', 'Error');
        return throwError(() => error);
      })
    );
  }

  // Load messages on service initialization
  private loadMessages(): void {
    this.getMessages().subscribe();
  }

  // Get message by ID
  getMessageById(messageId: string): Observable<Message> {
    // Use dummy data from JSON file
    const dummyResponse = dummyApiResponses.messages.getById;
    const message = dummyResponse.data as Message;
    
    return of(message).pipe(
      catchError(error => {
        console.error('Error getting message:', error);
        this.toastService.error('Failed to load message', 'Error');
        return throwError(() => error);
      })
    );
  }

  // Send a new message
  sendMessage(messageData: SendMessageRequest): Observable<Message> {
    // Use dummy data from JSON file
    const dummyResponse = dummyApiResponses.messages.sendMessage;
    const newMessage = dummyResponse.data as Message;
    
    return of(newMessage).pipe(
      tap(newMessage => {
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([newMessage, ...currentMessages]);
        this.updateUnreadCount([newMessage, ...currentMessages]);
        this.toastService.success('Message sent successfully', 'Success');
      }),
      catchError(error => {
        console.error('Error sending message:', error);
        this.toastService.error('Failed to send message', 'Error');
        return throwError(() => error);
      })
    );
  }

  // Reply to a message
  replyToMessage(originalMessageId: string, content: string): Observable<Message> {
    // Use dummy data from JSON file
    const dummyResponse = dummyApiResponses.messages.replyToMessage;
    const replyMessage = dummyResponse.data as Message;
    
    return of(replyMessage).pipe(
      tap(replyMessage => {
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([replyMessage, ...currentMessages]);
        this.updateUnreadCount([replyMessage, ...currentMessages]);
        this.toastService.success('Reply sent successfully', 'Success');
      }),
      catchError(error => {
        console.error('Error sending reply:', error);
        this.toastService.error('Failed to send reply', 'Error');
        return throwError(() => error);
      })
    );
  }

  // Mark messages as read
  markAsRead(messageIds: string[]): Observable<any> {
    // Use dummy data from JSON file
    const dummyResponse = dummyApiResponses.messages.markAsRead;
    
    return of(dummyResponse).pipe(
      tap(() => {
        const currentMessages = this.messagesSubject.value;
        const updatedMessages = currentMessages.map(message => 
          messageIds.includes(message.id) 
            ? { ...message, isRead: true }
            : message
        );
        this.messagesSubject.next(updatedMessages);
        this.updateUnreadCount(updatedMessages);
        this.toastService.success('Messages marked as read', 'Success');
      }),
      catchError(error => {
        console.error('Error marking messages as read:', error);
        this.toastService.error('Failed to mark messages as read', 'Error');
        return throwError(() => error);
      })
    );
  }

  // Mark all messages as read
  markAllAsRead(): Observable<any> {
    const unreadMessages = this.messagesSubject.value.filter(m => !m.isRead);
    const unreadIds = unreadMessages.map(m => m.id);
    
    if (unreadIds.length === 0) {
      return new Observable(observer => {
        observer.next({ success: true });
        observer.complete();
      });
    }
    
    return this.markAsRead(unreadIds);
  }

  // Delete message
  deleteMessage(messageId: string): Observable<any> {
    // Use dummy data from JSON file
    const dummyResponse = dummyApiResponses.messages.delete;
    
    return of(dummyResponse).pipe(
      tap(() => {
        const currentMessages = this.messagesSubject.value;
        const updatedMessages = currentMessages.filter(m => m.id !== messageId);
        this.messagesSubject.next(updatedMessages);
        this.updateUnreadCount(updatedMessages);
        this.toastService.success('Message deleted', 'Success');
      }),
      catchError(error => {
        console.error('Error deleting message:', error);
        this.toastService.error('Failed to delete message', 'Error');
        return throwError(() => error);
      })
    );
  }

  // Get messages by category
  getMessagesByCategory(category: string): Observable<Message[]> {
    // Use dummy data from JSON file
    const dummyResponse = dummyApiResponses.messages.getByCategory;
    const messages = (dummyResponse.data || []) as Message[];
    
    return of(messages).pipe(
      catchError(error => {
        console.error('Error loading messages by category:', error);
        this.toastService.error('Failed to load messages', 'Error');
        return throwError(() => error);
      })
    );
  }

  // Get unread count
  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  // Get current messages
  getCurrentMessages(): Message[] {
    return this.messagesSubject.value;
  }

  // Update unread count
  private updateUnreadCount(messages: Message[]): void {
    const unreadCount = messages.filter(m => !m.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // Refresh messages
  refreshMessages(): void {
    this.loadMessages();
  }

  // Get priority badge class
  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'badge-danger';
      case 'high':
        return 'badge-warning';
      case 'medium':
        return 'badge-info';
      case 'low':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  }

  // Get category badge class
  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'support':
        return 'badge-success';
      case 'invoice':
        return 'badge-warning';
      case 'project':
        return 'badge-danger';
      case 'system':
        return 'badge-info';
      case 'general':
      default:
        return 'badge-primary';
    }
  }
}
