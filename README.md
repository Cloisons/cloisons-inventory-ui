# Cloisons Inventory Management System - Frontend

A modern, responsive Angular application for managing inventory, projects, suppliers, and contractors in the construction industry.

## 🚀 Features

- **Modern Angular Architecture**: Built with Angular 20+ using standalone components
- **Responsive Design**: Mobile-first approach with beautiful UI/UX
- **Authentication**: Secure login with JWT token management
- **Real-time Notifications**: Toast notifications for user feedback
- **Loading States**: Elegant loading indicators for better UX
- **Accessibility**: WCAG 2.1 compliant with proper ARIA labels
- **Type Safety**: Full TypeScript implementation with strict mode
- **Performance Optimized**: OnPush change detection strategy

## 🛠️ Tech Stack

- **Angular 20+** - Frontend framework
- **TypeScript** - Type-safe JavaScript
- **SCSS** - Enhanced CSS with variables and mixins
- **RxJS** - Reactive programming
- **Material Design Icons** - Icon library
- **Angular Router** - Client-side routing
- **Angular Forms** - Form handling and validation

## 📁 Project Structure

```
src/
├── app/
│   ├── core/                    # Core functionality
│   │   ├── components/         # Shared core components
│   │   ├── guards/            # Route guards
│   │   ├── interceptors/      # HTTP interceptors
│   │   └── services/          # Core services
│   ├── shared/                 # Shared components
│   │   └── components/        # Reusable UI components
│   ├── login/                 # Login page
│   ├── dashboard/             # Dashboard page
│   ├── environments/          # Environment configuration
│   └── assets/               # Static assets
├── styles.scss               # Global styles
└── main.ts                  # Application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Angular CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cloisons-inventory-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200`

### Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## 🔧 Configuration

### Environment Variables

The application uses environment files for configuration:

- `src/environments/environment.ts` - Development configuration
- `src/environments/environment.prod.ts` - Production configuration

### API Configuration

Update the API URL in the environment files:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8082', // Your API URL
  appName: 'Cloisons Inventory Management',
  version: '1.0.0'
};
```

## 🎨 UI Components

### Core Components

- **UiLoaderComponent** - Loading indicator with customizable messages
- **ToastComponent** - Notification system with different types
- **SideNavComponent** - Collapsible navigation sidebar
- **MatInputComponent** - Custom input component with validation
- **UserInfoComponent** - User profile display
- **ApiStatusComponent** - API connection status indicator

### Styling

The application uses a comprehensive SCSS architecture:

- **Global Styles** - Base styles, typography, and utilities
- **Component Styles** - Scoped component styles
- **Responsive Design** - Mobile-first approach
- **Accessibility** - WCAG 2.1 compliant styles

## 🔐 Authentication

The application implements JWT-based authentication:

- **Login Form** - Email and password validation
- **Auth Guard** - Route protection
- **Auth Interceptor** - Automatic token attachment
- **Token Management** - Secure storage and refresh

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## ♿ Accessibility

The application follows WCAG 2.1 guidelines:

- **ARIA Labels** - Proper labeling for screen readers
- **Keyboard Navigation** - Full keyboard support
- **Focus Management** - Visible focus indicators
- **Color Contrast** - Sufficient contrast ratios
- **Semantic HTML** - Proper HTML structure

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run e2e
```

## 📦 Build & Deployment

### Development Build
```bash
npm run build
```

### Production Build
```bash
npm run build --configuration=production
```

### Docker Support
```bash
# Build Docker image
docker build -t cloisons-inventory-ui .

# Run Docker container
docker run -p 4200:80 cloisons-inventory-ui
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - Authentication system
  - Dashboard with statistics
  - Responsive design
  - Accessibility features

---

**Built with ❤️ by the Cloisons Development Team**