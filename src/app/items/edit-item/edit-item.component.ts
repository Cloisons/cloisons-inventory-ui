import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { finalize, Subject, takeUntil } from 'rxjs';
import { ItemService, ItemUpdateRequest, Item } from '../../core/services/item.service';
import { SupplierService, Supplier } from '../../core/services/supplier.service';
import { CategoryService, Category } from '../../core/services/category.service';
import { S3UploadService } from '../../shared/services/s3-upload.service';
import { MatInputComponent } from '../../shared/components/mat-input/mat-input.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-edit-item',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatInputComponent, NgSelectModule],
  templateUrl: './edit-item.component.html',
  styleUrls: ['./edit-item.component.scss']
})
export class EditItemComponent implements OnDestroy {
  form!: FormGroup;
  submitting = false;
  itemId!: string;
  suppliers: Supplier[] = [];
  categories: Category[] = [];
  supplierOptions: { value: string; label: string }[] = [];
  categoryOptions: { value: string; label: string }[] = [];
  unitScaleOptions: { value: string; label: string }[] = [
    { value: 'numbers', label: 'Numbers' },
    { value: 'meters', label: 'Meters' },
    { value: 'length', label: 'Length' }
  ];
  imagePreviewUrl: string | null = null;
  uploading = false;
  uploadError: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private itemService: ItemService,
    private supplierService: SupplierService,
    private categoryService: CategoryService,
    private router: Router,
    private s3UploadService: S3UploadService,
    private toastService: ToastService
  ) {
    this.itemId = this.route.snapshot.paramMap.get('id') || '';
    this.form = this.createForm();
    this.loadSuppliers();
    this.loadCategories();
    this.loadItem();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      categoryId: [null],
      unitScale: ['', Validators.required]
    });
  }

  private loadSuppliers(): void {
    this.supplierService.listSuppliers(1, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (suppliers) => {
          this.suppliers = suppliers;
          this.supplierOptions = suppliers.map((s) => ({ value: s._id, label: s.supplierName }));
        },
        error: () => (this.suppliers = [])
      });
  }

  private loadCategories(): void {
    this.categoryService.listCategories(1, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.categories = resp.items || [];
          this.categoryOptions = this.categories.map((c) => ({ value: c._id, label: c.categoryName }));
        },
        error: () => (this.categories = [])
      });
  }

  private loadItem(): void {
    if (!this.itemId) return;
    this.itemService.getItemById(this.itemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const item = res.data as unknown as Item;
          this.form.patchValue({
            itemCode: item.itemCode,
            itemName: item.itemName,
            itemImage: item.itemImage,
            itemDescription: item.itemDescription,
            supplierId: item.supplierId ? (item.supplierId as any)._id : '',
            categoryId: item.categoryId ? (item.categoryId as any)._id : null,
            unitScale: item.unitScale
          });
          this.imagePreviewUrl = item.itemImage || null;
        },
        error: () => {}
      });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.itemId) return;
    this.submitting = true;
    const raw = this.form.value as any;
    const payload: ItemUpdateRequest = {
      _id: this.itemId,
      itemCode: raw.itemCode,
      itemName: raw.itemName,
      itemImage: raw.itemImage,
      itemDescription: raw.itemDescription,
      supplierId: raw.supplierId,
      categoryId: raw.categoryId || null,
      unitScale: raw.unitScale
    };

    this.itemService.updateItem(this.itemId, payload)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: () => {
          this.toastService.success('Item updated successfully!');
          this.router.navigate(['/items']);
        },
        error: () => {}
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!this.validateImageFile(file)) return;
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

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!this.validateImageFile(file)) return;
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
  get supplierIdControl() { return this.form.get('supplierId') as FormControl; }
  get unitScaleControl() { return this.form.get('unitScale') as FormControl; }
}


