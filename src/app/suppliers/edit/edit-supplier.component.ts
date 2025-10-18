import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { SupplierService } from '../../core/services/supplier.service';
import { MatInputComponent } from '../../shared/components/mat-input/mat-input.component';
import { MatButtonComponent } from '../../shared/components/mat-button/mat-button.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-supplier',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatInputComponent, MatButtonComponent, NgSelectModule, FormsModule],
  templateUrl: './edit-supplier.component.html',
  styleUrls: ['./edit-supplier.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditSupplierComponent implements OnInit {
  form: FormGroup;
  submitting = false;
  supplierId = '';
  countryOptions: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
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

    this.supplierId = this.route.snapshot.paramMap.get('id') || '';
    if (this.supplierId) {
      this.load();
    }
  }

  ngOnInit(): void {
    this.loadCountries();
  }

  private loadCountries(): void {
    this.supplierService.getCountries().subscribe({
      next: (countries: string[]) => {
        this.countryOptions = countries.map(country => ({
          value: country,
          label: country
        }));
      },
      error: (error) => {
        console.error('Failed to load countries:', error);
      }
    });
  }

  load(): void {
    this.supplierService.getSupplier(this.supplierId).subscribe({
      next: (s) => this.form.patchValue(s as any)
    });
  }

  onSubmit(): void {
    if (this.submitting || this.form.invalid) return;
    this.submitting = true;

    const payload = this.form.value;
    this.supplierService.updateSupplier(this.supplierId, payload).subscribe({
      next: () => this.router.navigate(['/suppliers']),
      error: () => (this.submitting = false),
    });
  }
}



