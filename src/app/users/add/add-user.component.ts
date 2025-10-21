import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { UserService, CreateUserRequest } from '../../core/services/user.service';
import { MatInputComponent } from '../../shared/components/mat-input/mat-input.component';
import { MatButtonComponent } from '../../shared/components/mat-button/mat-button.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatLabelComponent } from '../../shared/components/mat-label/mat-label.component';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatInputComponent, MatButtonComponent, NgSelectModule, MatLabelComponent],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddUserComponent {
  form: FormGroup;
  submitting = false;
  errorMessage = '';

  roleOptions = [
    { value: 'user1', label: 'User 1' },
    { value: 'user2', label: 'User 2' }
    // Note: Super admin users cannot be created through this interface for security reasons
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(128)]],
      role: ['user1', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.submitting || this.form.invalid) return;
    
    this.submitting = true;
    this.errorMessage = '';

    const payload: CreateUserRequest = this.form.value;
    this.userService.createUser(payload).subscribe({
      next: () => {
        this.router.navigate(['/users']);
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Failed to create user';
        this.submitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }
}
