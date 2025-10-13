import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ContractorService } from '../../core/services/contractor.service';
import { MatInputComponent } from '../../shared/components/mat-input/mat-input.component';
import { MatButtonComponent } from '../../shared/components/mat-button/mat-button.component';

@Component({
  selector: 'app-edit-contractor',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatInputComponent, MatButtonComponent],
  templateUrl: './edit-contractor.component.html',
  styleUrls: ['./edit-contractor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditContractorComponent {
  form: FormGroup;
  submitting = false;
  contractorId = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private contractorService: ContractorService,
    private router: Router
  ) {
    this.form = this.fb.group({
      contractorName: ['', [Validators.required, Validators.maxLength(200)]],
      contactPerson: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
      phoneNumber: ['', [Validators.required, Validators.maxLength(50)]],
      address: ['', [Validators.required, Validators.maxLength(500)]],
    });

    this.contractorId = this.route.snapshot.paramMap.get('id') || '';
    if (this.contractorId) {
      this.load();
    }
  }

  load(): void {
    this.contractorService.getContractor(this.contractorId).subscribe({
      next: (c) => this.form.patchValue(c as any)
    });
  }

  onSubmit(): void {
    if (this.submitting || this.form.invalid) return;
    this.submitting = true;

    const payload = this.form.value;
    this.contractorService.updateContractor(this.contractorId, payload).subscribe({
      next: () => this.router.navigate(['/contractors']),
      error: () => (this.submitting = false),
    });
  }
}


