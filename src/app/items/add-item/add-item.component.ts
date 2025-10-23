import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { ItemService, ItemCreateRequest } from '../../core/services/item.service';
import { SupplierService, Supplier } from '../../core/services/supplier.service';
import { S3UploadService } from '../../shared/services/s3-upload.service';
import { MatInputComponent } from '../../shared/components/mat-input/mat-input.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-add-item',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatInputComponent, NgSelectModule],
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.scss']
})
export class AddItemComponent {
  form!: FormGroup;

  suppliers: Supplier[] = [];
  submitting = false;
  uploading = false;
  imagePreviewUrl: string | null = null;
  supplierOptions: { value: string; label: string }[] = [];
  unitScaleOptions: { value: string; label: string }[] = [
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
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.isSuperAdmin = this.authService.hasRole('superAdmin');
    this.isUser2 = this.authService.hasRole('user2');
    this.form = this.createForm();
    this.loadSuppliers();
  }

  private itemCodeValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    
    // If no value provided, it's valid (itemCode is optional)
    if (!value || value.trim().length === 0) {
      return null;
    }
    
    // Check if it's a string
    if (typeof value !== 'string') {
      return { itemCodeType: { message: 'Item code must be a string' } };
    }
    
    const trimmedValue = value.trim();
    
    // Check if empty after trimming
    if (trimmedValue.length === 0) {
      return { itemCodeEmpty: { message: 'Item code cannot be empty' } };
    }
    
    // Check length
    if (trimmedValue.length > 20) {
      return { itemCodeLength: { message: 'Item code cannot exceed 20 characters' } };
    }
    
    // Check pattern - only uppercase letters, numbers, hyphens, and underscores
    if (!/^[A-Z0-9_-]+$/.test(trimmedValue)) {
      return { itemCodePattern: { message: 'Item code can only contain uppercase letters, numbers, hyphens, and underscores' } };
    }
    
    return null;
  }

  private createForm() {
    return this.fb.group({
      itemCode: ['', [this.itemCodeValidator.bind(this)]],
      itemName: ['', [Validators.required, Validators.maxLength(100)]],
      itemImage: [''],
      itemDescription: ['', [Validators.required, Validators.maxLength(1000)]],
      supplierId: ['', Validators.required],
      unitScale: [this.isSuperAdmin ? '' : 'numbers', this.isSuperAdmin ? [Validators.required] : []],
      totalQty: [0.5, [Validators.required, Validators.min(0.5)]],
      unitCost: [0.5, [Validators.required, Validators.min(0.5)]],
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
      unitCost: Number(raw.unitCost),
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
        this.toastService.success('Item created successfully!');
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

  // Getter methods for form controls to ensure proper typing
  get itemNameControl() { return this.form.get('itemName') as FormControl; }
  get itemCodeControl() { return this.form.get('itemCode') as FormControl; }
  get totalQtyControl() { return this.form.get('totalQty') as FormControl; }
  get unitCostControl() { return this.form.get('unitCost') as FormControl; }
  get sellingCostControl() { return this.form.get('sellingCost') as FormControl; }
}
