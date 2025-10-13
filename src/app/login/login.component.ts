import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatInputComponent } from '../shared/components/mat-input/mat-input.component';
import { MatLabelComponent } from '../shared/components/mat-label/mat-label.component';
import { AuthService, LoginRequest } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatInputComponent, MatLabelComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  loginForm: FormGroup;
  rememberPassword: boolean = false;

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      const credentials: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          // If we get here, the response was successful
          // Get the return URL from query params or default to dashboard
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigate([returnUrl]);
        },
        error: (error) => {
          // The communication service should already show the error toast,
          // but we'll add a fallback here
          if (!error?.error?.message) {
            this.toastService.error('Login failed. Please try again.', 'Login Error');
          }
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      this.loginForm.markAllAsTouched();
      this.toastService.warning('Please fill in all required fields correctly.', 'Validation Error');
      this.cdr.markForCheck();
    }
  }

  // onForgotPassword(): void {
  //   // TODO: Implement forgot password logic
  //   this.toastService.info('Forgot password functionality coming soon.', 'Feature Coming Soon');
  //   this.cdr.markForCheck();
  // }

  // onCreateAccount(): void {
  //   // TODO: Implement create account logic
  //   this.toastService.info('Create account functionality coming soon.', 'Feature Coming Soon');
  //   this.cdr.markForCheck();
  // }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors?.['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors?.['minlength']) {
        return `Password must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }
}
