# Notification and Message Components

This directory contains the notification and message components that provide a user-friendly interface for displaying and managing notifications and messages in the application.

## Components

### NotificationComponent (`notification/notification.component.ts`)

A standalone Angular component that displays notifications in a dropdown format similar to the user info component.

**Features:**
- Displays notification count badge
- Dropdown with notification list
- Mark as read functionality
- Delete notifications
- Mark all as read
- Responsive design
- Type-based styling (info, success, warning, error)

**Usage:**
```html
<app-notification 
  (notificationClick)="onNotificationClick($event)"
  (viewAll)="onViewAllNotifications()">
</app-notification>
```

**Events:**
- `notificationClick`: Emitted when a notification is clicked
- `viewAll`: Emitted when "View all notifications" is clicked

### MessageComponent (`message/message.component.ts`)

A standalone Angular component that displays messages in a dropdown format similar to the user info component.

**Features:**
- Displays message count badge
- Dropdown with message list
- Mark as read functionality
- Delete messages
- Mark all as read
- Priority and category badges
- Sender avatar with initials
- Responsive design

**Usage:**
```html
<app-message 
  (messageClick)="onMessageClick($event)"
  (viewAll)="onViewAllMessages()">
</app-message>
```

**Events:**
- `messageClick`: Emitted when a message is clicked
- `viewAll`: Emitted when "View all messages" is clicked

## Services

### NotificationService (`../services/notification.service.ts`)

Service for managing notification data and API interactions.

**Key Methods:**
- `getNotifications()`: Fetch all notifications
- `markAsRead(notificationIds)`: Mark specific notifications as read
- `markAllAsRead()`: Mark all notifications as read
- `deleteNotification(id)`: Delete a notification
- `createNotification(notification)`: Create a new notification

**Observables:**
- `notifications$`: Stream of all notifications
- `unreadCount$`: Stream of unread notification count

### MessageService (`../services/message.service.ts`)

Service for managing message data and API interactions.

**Key Methods:**
- `getMessages()`: Fetch all messages
- `sendMessage(messageData)`: Send a new message
- `replyToMessage(originalMessageId, content)`: Reply to a message
- `markAsRead(messageIds)`: Mark specific messages as read
- `markAllAsRead()`: Mark all messages as read
- `deleteMessage(id)`: Delete a message
- `getMessagesByCategory(category)`: Get messages by category

**Observables:**
- `messages$`: Stream of all messages
- `unreadCount$`: Stream of unread message count

## Data Models

### Notification Interface
```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  actionUrl?: string;
  actionText?: string;
}
```

### Message Interface
```typescript
interface Message {
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
  createdAt: Date;
  updatedAt: Date;
  attachments?: MessageAttachment[];
  replyToId?: string;
  threadId?: string;
}
```

## Integration

The components are already integrated into the header component and can be used in any parent component by including them in the template and handling their events.

**Example in a parent component:**
```typescript
onNotificationClick(notification: Notification): void {
  // Handle notification click
  console.log('Notification clicked:', notification);
  // Navigate to notification detail page
  this.router.navigate(['/notifications', notification.id]);
}

onMessageClick(message: Message): void {
  // Handle message click
  console.log('Message clicked:', message);
  // Navigate to message detail page
  this.router.navigate(['/messages', message.id]);
}
```

## Styling

The components use inline styles that are scoped to the component. They follow the same design patterns as the existing user info component and integrate seamlessly with the application's design system.

## API Integration

Both services are configured to work with the existing API service and communication service. They expect the following API endpoints:

**Notifications:**
- `GET /notifications` - Get all notifications
- `PUT /notifications/mark-read` - Mark notifications as read
- `DELETE /notifications/:id` - Delete notification
- `POST /notifications` - Create notification

**Messages:**
- `GET /messages` - Get all messages
- `GET /messages/:id` - Get message by ID
- `POST /messages` - Send message
- `POST /messages/:id/reply` - Reply to message
- `PUT /messages/mark-read` - Mark messages as read
- `DELETE /messages/:id` - Delete message
- `GET /messages/category/:category` - Get messages by category
