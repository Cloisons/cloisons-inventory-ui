import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { UserService, UpdateUserRequest, UpdateUserPasswordRequest } from '../../core/services/user.service';
import { MatInputComponent } from '../../shared/components/mat-input/mat-input.component';
import { MatButtonComponent } from '../../shared/components/mat-button/mat-button.component';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatInputComponent, MatButtonComponent, NgSelectModule],
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditUserComponent {
  form: FormGroup;
  passwordForm: FormGroup;
  submitting = false;
  passwordSubmitting = false;
  errorMessage = '';
  passwordErrorMessage = '';
  userId = '';
  isLoading = true;
  showPasswordSection = false;

  roleOptions = [
    { value: 'user1', label: 'User 1' },
    { value: 'user2', label: 'User 2' }
    // Note: Super admin users cannot be edited through this interface for security reasons
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
      role: ['user', [Validators.required]]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(128)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.load();
    } else {
      this.router.navigate(['/users']);
    }
  }

  load(): void {
    this.isLoading = true;
    this.userService.getUserById(this.userId).subscribe({
      next: (response) => {
        const user = response.user;
        
        // Check if user is super admin - prevent editing
        if (user.role === 'superAdmin') {
          this.errorMessage = 'Super admin users cannot be edited through this interface for security reasons.';
          this.isLoading = false;
          this.cdr.markForCheck();
          return;
        }
        
        this.form.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        });
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Failed to load user';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSubmit(): void {
    if (this.submitting || this.form.invalid) return;
    
    this.submitting = true;
    this.errorMessage = '';

    const payload: UpdateUserRequest = this.form.value;
    this.userService.updateUser(this.userId, payload).subscribe({
      next: () => {
        this.router.navigate(['/users']);
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Failed to update user';
        this.submitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }

  // Password match validator
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  // Toggle password section visibility
  togglePasswordSection(): void {
    this.showPasswordSection = !this.showPasswordSection;
    if (!this.showPasswordSection) {
      this.passwordForm.reset();
      this.passwordErrorMessage = '';
    }
  }

  // Update password
  onPasswordSubmit(): void {
    if (this.passwordSubmitting || this.passwordForm.invalid) return;
    
    this.passwordSubmitting = true;
    this.passwordErrorMessage = '';

    const payload: UpdateUserPasswordRequest = {
      newPassword: this.passwordForm.value.newPassword
    };

    this.userService.updateUserPassword(this.userId, payload).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.showPasswordSection = false;
        this.passwordSubmitting = false;
        this.cdr.markForCheck();
        // You could show a success message here
      },
      error: (err) => {
        this.passwordErrorMessage = err?.message || 'Failed to update password';
        this.passwordSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Cancel password update
  onPasswordCancel(): void {
    this.passwordForm.reset();
    this.showPasswordSection = false;
    this.passwordErrorMessage = '';
  }

  // Getter methods for form controls to ensure proper typing
  get firstNameControl() { return this.form.get('firstName') as FormControl; }
  get lastNameControl() { return this.form.get('lastName') as FormControl; }
  get emailControl() { return this.form.get('email') as FormControl; }
  get roleControl() { return this.form.get('role') as FormControl; }
  get newPasswordControl() { return this.passwordForm.get('newPassword') as FormControl; }
  get confirmPasswordControl() { return this.passwordForm.get('confirmPassword') as FormControl; }
}
