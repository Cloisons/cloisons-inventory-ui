import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProfileService, UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../core/services/profile.service';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';
import { UiLoaderService } from '../core/services/ui-loader.service';
import { MatInputComponent } from '../shared/components/mat-input/mat-input.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  userProfile: UserProfile | null = null;
  isEditingProfile = false;
  isChangingPassword = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private toastService: ToastService,
    private uiLoaderService: UiLoaderService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private initializeForms(): void {
    // Profile form
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]]
    });

    // Password form
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.uiLoaderService.start('Loading profile...');

    this.profileService.getProfile().subscribe({
      next: (response) => {
        console.log('Profile API Response:', response);
        // The response interceptor unwraps the data, so response contains the user object
        if (response && response.user) {
          this.userProfile = response.user;
          this.populateProfileForm();
          // Trigger change detection to ensure the view updates
          this.cdr.detectChanges();
        } else {
          console.error('Profile response error:', response);
          this.toastService.error('Failed to load profile');
        }
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.toastService.error('Failed to load profile');
      },
      complete: () => {
        this.isLoading = false;
        this.uiLoaderService.stop();
        // Trigger change detection after loading is complete
        this.cdr.detectChanges();
      }
    });
  }

  private populateProfileForm(): void {
    if (this.userProfile) {
      this.profileForm.patchValue({
        firstName: this.userProfile.firstName,
        lastName: this.userProfile.lastName,
        email: this.userProfile.email
      });
    }
  }

  toggleEditProfile(): void {
    this.isEditingProfile = !this.isEditingProfile;
    if (!this.isEditingProfile) {
      // Reset form if canceling edit
      this.populateProfileForm();
    }
  }

  toggleChangePassword(): void {
    this.isChangingPassword = !this.isChangingPassword;
    if (!this.isChangingPassword) {
      // Reset password form if canceling
      this.passwordForm.reset();
    }
  }

  onUpdateProfile(): void {
    if (this.profileForm.valid) {
      const profileData: UpdateProfileRequest = this.profileForm.value;
      
      this.uiLoaderService.start('Updating profile...');
      
      this.profileService.updateProfile(profileData).subscribe({
        next: (response) => {
          if (response && response.user) {
            this.userProfile = response.user;
            this.isEditingProfile = false;
            this.toastService.success('Profile updated successfully');
            
            // Update auth service with new user data
            this.authService.getCurrentUser();
            // Trigger change detection to ensure the view updates
            this.cdr.detectChanges();
          } else {
            this.toastService.error('Failed to update profile');
          }
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.toastService.error('Failed to update profile');
        },
        complete: () => {
          this.uiLoaderService.stop();
          // Trigger change detection after update is complete
          this.cdr.detectChanges();
        }
      });
    } else {
      this.markFormGroupTouched(this.profileForm);
      this.toastService.error('Please fill in all required fields correctly');
    }
  }

  onChangePassword(): void {
    if (this.passwordForm.valid) {
      const passwordData: ChangePasswordRequest = {
        currentPassword: this.passwordForm.get('currentPassword')?.value,
        newPassword: this.passwordForm.get('newPassword')?.value
      };
      
      this.uiLoaderService.start('Changing password...');
      
      this.profileService.changePassword(passwordData).subscribe({
        next: (response) => {
          // Password change typically returns success message or empty response
          this.passwordForm.reset();
          this.isChangingPassword = false;
          this.toastService.success('Password changed successfully');
        },
        error: (error) => {
          console.error('Error changing password:', error);
          this.toastService.error('Failed to change password');
        },
        complete: () => {
          this.uiLoaderService.stop();
        }
      });
    } else {
      this.markFormGroupTouched(this.passwordForm);
      this.toastService.error('Please fill in all required fields correctly');
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }
    return '';
  }

  hasFieldError(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field?.errors && field.touched);
  }
}
