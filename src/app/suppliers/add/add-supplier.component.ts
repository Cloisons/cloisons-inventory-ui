import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { SupplierService } from '../../core/services/supplier.service';
import { MatInputComponent } from '../../shared/components/mat-input/mat-input.component';
import { MatButtonComponent } from '../../shared/components/mat-button/mat-button.component';

@Component({
  selector: 'app-add-supplier',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatInputComponent, MatButtonComponent],
  templateUrl: './add-supplier.component.html',
  styleUrls: ['./add-supplier.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddSupplierComponent {
  form: FormGroup;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private router: Router
  ) {
    this.form = this.fb.group({
      supplierName: ['', [Validators.required, Validators.maxLength(200)]],
      contactPerson: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
      phoneNumber: ['', [Validators.required, Validators.maxLength(50)]],
      address: ['', [Validators.required, Validators.maxLength(500)]],
      countryOfOrigin: ['', [Validators.required, Validators.maxLength(100)]],
    });
  }

  onSubmit(): void {
    if (this.submitting || this.form.invalid) return;
    this.submitting = true;

    const payload = this.form.value;
    this.supplierService.createSupplier(payload).subscribe({
      next: () => this.router.navigate(['/suppliers']),
      error: () => (this.submitting = false),
    });
  }
}



