# Authentication System

This directory contains the complete authentication system for the Cloisons Inventory Management application.

## Structure

```
core/
├── services/
│   └── auth.service.ts          # Main authentication service
├── interceptors/
│   └── auth.interceptor.ts      # HTTP interceptor for token handling
├── guards/
│   ├── auth.guard.ts           # Route guard for authentication
│   └── role.guard.ts           # Route guard for role-based access
└── components/
    └── user-info/
        └── user-info.component.ts  # User information display component
```

## Features

### AuthService
- **Login/Logout**: Handles user authentication with backend API
- **Token Management**: Automatically stores and manages JWT tokens
- **User State**: Maintains current user information using RxJS observables
- **Role-based Access**: Provides methods for role checking
- **Token Validation**: Validates tokens with backend
- **Auto-logout**: Automatically logs out on token expiration

### AuthInterceptor
- **Automatic Token Injection**: Adds Bearer token to all HTTP requests
- **Error Handling**: Automatically handles 401 errors and redirects to login
- **Token Refresh**: Can be extended to handle token refresh

### AuthGuard
- **Route Protection**: Protects routes that require authentication
- **Redirect Logic**: Redirects unauthenticated users to login page
- **Return URL**: Preserves intended destination for post-login redirect

### RoleGuard
- **Role-based Access**: Protects routes based on user roles
- **Flexible Configuration**: Can be configured per route with expected roles

## API Integration

The authentication system integrates with the backend API running on port 8082:

### Endpoints
- `POST /api/auth/login` - User login
- `GET /api/auth/validate` - Token validation
- `POST /api/auth/refresh` - Token refresh (optional)

### Request/Response Format

#### Login Request
```typescript
{
  email: string;
  password: string;
}
```

#### Login Response
```typescript
{
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  };
}
```

## Usage

### 1. Login Component
```typescript
// Inject AuthService
constructor(private authService: AuthService) {}

// Login user
onLogin() {
  this.authService.login(credentials).subscribe({
    next: (response) => {
      if (response.success) {
        this.router.navigate(['/dashboard']);
      }
    },
    error: (error) => {
      // Handle login error
    }
  });
}
```

### 2. Route Protection
```typescript
// In app.routes.ts
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [AuthGuard]
}
```

### 3. Role-based Protection
```typescript
// In app.routes.ts
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [RoleGuard],
  data: { expectedRole: 'admin' }
}
```

### 4. User State Subscription
```typescript
// Subscribe to current user
this.authService.currentUser$.subscribe(user => {
  if (user) {
    console.log('User logged in:', user.name);
  }
});

// Check authentication status
this.authService.isAuthenticated$.subscribe(isAuth => {
  console.log('Is authenticated:', isAuth);
});
```

## Configuration

### Backend URL
Update the API base URL in `auth.service.ts`:
```typescript
private readonly API_BASE_URL = 'http://localhost:8082/api';
```

### Token Storage
Tokens are stored in localStorage with keys:
- `auth_token`: JWT token
- `user_data`: User information

## Security Features

1. **Automatic Token Injection**: All HTTP requests automatically include the Bearer token
2. **Token Validation**: Tokens are validated on app initialization
3. **Auto-logout**: Users are automatically logged out on token expiration
4. **Route Protection**: Unauthenticated users cannot access protected routes
5. **Role-based Access**: Fine-grained access control based on user roles

## Error Handling

The system handles various error scenarios:
- Network errors during login
- Invalid credentials
- Token expiration
- Server errors
- Unauthorized access attempts

All errors are properly logged and user-friendly messages are displayed.

## Testing

To test the authentication system:

1. Start the backend server on port 8082
2. Start the Angular development server
3. Navigate to the login page
4. Enter valid credentials
5. Verify successful login and dashboard access
6. Test logout functionality
7. Test route protection by accessing protected routes without login
