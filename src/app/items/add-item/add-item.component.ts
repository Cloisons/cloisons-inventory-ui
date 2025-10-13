import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ItemService, ItemCreateRequest } from '../../core/services/item.service';
import { SupplierService, Supplier } from '../../core/services/supplier.service';
import { S3UploadService } from '../../shared/services/s3-upload.service';
import { MatInputComponent } from '../../shared/components/mat-input/mat-input.component';
import { MatSelectComponent } from '../../shared/components/mat-select/mat-select.component';
import { MatSelectOption } from '../../shared/components/mat-select/mat-select.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-add-item',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatInputComponent, MatSelectComponent],
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.scss']
})
export class AddItemComponent {
  form!: FormGroup;

  suppliers: Supplier[] = [];
  submitting = false;
  uploading = false;
  imagePreviewUrl: string | null = null;
  supplierOptions: MatSelectOption[] = [];
  unitScaleOptions: MatSelectOption[] = [
    { value: 'numbers', label: 'Numbers' },
    { value: 'meters', label: 'Meters' },
    { value: 'length', label: 'Length' }
  ];
  uploadError: string = '';
  isSuperAdmin = false;
  isUser2 = false;

  constructor(
    private fb: FormBuilder,
    private itemService: ItemService,
    private supplierService: SupplierService,
    private router: Router,
    private s3UploadService: S3UploadService,
    private authService: AuthService
  ) {
    this.isSuperAdmin = this.authService.hasRole('superAdmin');
    this.isUser2 = this.authService.hasRole('user2');
    this.form = this.createForm();
    this.loadSuppliers();
  }

  private createForm() {
    return this.fb.group({
      itemCode: ['', [Validators.maxLength(20)]],
      itemName: ['', [Validators.required, Validators.maxLength(100)]],
      itemImage: [''],
      itemDescription: ['', [Validators.required, Validators.maxLength(1000)]],
      supplierId: ['', Validators.required],
      unitScale: [this.isSuperAdmin ? '' : 'numbers', this.isSuperAdmin ? [Validators.required] : []],
      totalQty: [0, [Validators.required, Validators.min(0)]],
      unitCost: [this.isUser2 ? 0 : 0, this.isUser2 ? [] : [Validators.required, Validators.min(0)]],
      sellingCost: [undefined as number | undefined, [Validators.min(0)]]
    });
  }

  private loadSuppliers(): void {
    this.supplierService.listSuppliers(1, 100).subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
        this.supplierOptions = suppliers.map((s) => ({ value: s._id, label: s.supplierName }));
      },
      error: () => (this.suppliers = [])
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.submitting = true;

    const raw = this.form.value as any;
    const payload: ItemCreateRequest = {
      itemCode: raw.itemCode,
      itemName: raw.itemName,
      itemImage: raw.itemImage,
      itemDescription: raw.itemDescription,
      supplierId: raw.supplierId,
      unitScale: raw.unitScale,
      totalQty: Number(raw.totalQty),
      unitCost: this.isUser2 ? 0 : Number(raw.unitCost), // Set unitCost to 0 for user2
      sellingCost: raw.sellingCost === undefined || raw.sellingCost === null || raw.sellingCost === ''
        ? undefined
        : Number(raw.sellingCost)
    };

    // Guard against NaN from empty/invalid inputs
    if (Number.isNaN(payload.totalQty)) payload.totalQty = 0;
    if (Number.isNaN(payload.unitCost)) payload.unitCost = 0;
    if (payload.sellingCost !== undefined && Number.isNaN(payload.sellingCost)) {
      payload.sellingCost = undefined;
    }
    this.itemService.createItem(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/items']);
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    // Only single file allowed
    const file = input.files[0];
    if (!this.validateImageFile(file)) {
      return;
    }
    this.uploading = true;
    // Preview
    const reader = new FileReader();
    reader.onload = () => { this.imagePreviewUrl = reader.result as string; };
    reader.readAsDataURL(file);
    this.s3UploadService.uploadFile(file, 'items').subscribe({
      next: (url) => {
        this.form.patchValue({ itemImage: url });
        this.uploading = false;
      },
      error: () => {
        this.uploading = false;
      }
    });
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    // Only single file allowed
    const file = files[0];
    if (!this.validateImageFile(file)) {
      return;
    }
    this.onFileFromDrag(file);
  }

  private onFileFromDrag(file: File): void {
    this.uploading = true;
    const reader = new FileReader();
    reader.onload = () => { this.imagePreviewUrl = reader.result as string; };
    reader.readAsDataURL(file);
    this.s3UploadService.uploadFile(file, 'items').subscribe({
      next: (url) => {
        this.form.patchValue({ itemImage: url });
        this.uploading = false;
      },
      error: () => {
        this.uploading = false;
      }
    });
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.imagePreviewUrl = null;
    this.form.patchValue({ itemImage: '' });
  }

  private validateImageFile(file: File): boolean {
    this.uploadError = '';
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (!file.type.startsWith('image/')) {
      this.uploadError = 'Only image files are allowed.';
      return false;
    }
    if (file.size > maxSize) {
      this.uploadError = 'Maximum file size is 5 MB.';
      return false;
    }
    return true;
  }
}
