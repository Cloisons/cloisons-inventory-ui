# Toast Notification System

This document explains how to use the toast notification system in the Cloisons Inventory UI application.

## Overview

The toast notification system provides a user-friendly way to display success, error, warning, and info messages to users. It automatically handles API error responses and provides methods for manual toast display.

## Components

### ToastService (`toast.service.ts`)

The main service for managing toast notifications. It provides methods to show different types of toast messages.

### ToastComponent (`toast.component.ts`)

The UI component that renders the toast notifications. It's automatically included in the main app component.

## Automatic Error Handling

The system automatically shows toast messages for API responses with non-200 status codes through the `AuthInterceptor`. This means:

- **400 Bad Request**: Shows validation errors
- **401 Unauthorized**: Shows authentication errors and redirects to login
- **403 Forbidden**: Shows permission errors
- **404 Not Found**: Shows resource not found errors
- **422 Validation Error**: Shows validation errors
- **500 Server Error**: Shows server error messages
- **502/503/504 Service Unavailable**: Shows service unavailable messages

## Manual Usage

### Basic Usage

```typescript
import { ToastService } from './core/services/toast.service';

constructor(private toastService: ToastService) {}

// Show success message
this.toastService.success('Operation completed successfully!');

// Show error message
this.toastService.error('Something went wrong!');

// Show warning message
this.toastService.warning('Please check your input.');

// Show info message
this.toastService.info('This is an informational message.');
```

### Advanced Usage

```typescript
// Show toast with custom title
this.toastService.success('Data saved successfully!', 'Success');

// Show toast with custom duration (10 seconds)
this.toastService.info('This will disappear in 10 seconds', 'Info', 10000);

// Show persistent toast (no auto-dismiss)
this.toastService.error('Critical error - manual dismissal required', 'Error', 0);

// Dismiss specific toast
this.toastService.dismiss(toastId);

// Dismiss all toasts
this.toastService.dismissAll();
```

### In HTTP Services

```typescript
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

getData(): Observable<any> {
  return this.http.get('/api/data')
    .pipe(
      catchError((error) => {
        // The interceptor will automatically show the error toast
        // You can add additional error handling here if needed
        console.error('API call failed:', error);
        return throwError(() => error);
      })
    );
}
```

## Toast Types

- **Success**: Green color, check circle icon
- **Error**: Red color, alert circle icon
- **Warning**: Yellow color, alert icon
- **Info**: Blue color, information icon

## Features

- **Auto-dismiss**: Toasts automatically disappear after 5 seconds (configurable)
- **Manual dismiss**: Users can click the close button to dismiss toasts
- **Click to dismiss**: Users can click anywhere on the toast to dismiss it
- **Progress bar**: Visual indicator showing remaining time
- **Responsive**: Adapts to different screen sizes
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Multiple toasts**: Supports displaying multiple toasts simultaneously

## Styling

The toast component uses SCSS for styling and includes:
- Smooth animations and transitions
- Hover effects
- Responsive design for mobile devices
- Material Design inspired icons (using MDI icons)

## Configuration

The default toast duration can be changed in the `ToastService` constructor:

```typescript
private defaultDuration = 5000; // 5 seconds
```

## Best Practices

1. **Use appropriate toast types**: Use success for positive actions, error for failures, warning for caution, and info for general information.

2. **Keep messages concise**: Toast messages should be brief and clear.

3. **Don't overuse toasts**: Avoid showing too many toasts at once as it can overwhelm users.

4. **Use persistent toasts sparingly**: Only use persistent toasts (duration: 0) for critical errors that require user attention.

5. **Test error scenarios**: Make sure your error handling works correctly by testing various API error responses.

## Example Implementation

See `example-usage.service.ts` for a complete example of how to use the toast system in your services.
