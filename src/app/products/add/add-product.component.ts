import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators, FormGroup, FormArray, FormControl } from '@angular/forms';
import { MatInputComponent } from '../../shared/components/mat-input/mat-input.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { ProductService } from '../../core/services/product.service';
import { S3UploadService } from '../../shared/services/s3-upload.service';
import { ItemService, Item } from '../../core/services/item.service';
import { CategoryService, Category } from '../../core/services/category.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, MatInputComponent, NgMultiSelectDropDownModule, NgSelectModule],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddProductComponent implements OnInit, OnDestroy {
  form: FormGroup;
  submitting = false;
  uploading = false;
  imagePreviewUrl: string | null = null;
  uploadError: string = '';
  availableItems: Item[] = [];
  loadingItems = false;
  loadingCategories = false;
  dropdownSettings: any = null;
  categories: Category[] = [];
  categoryOptionsList: any[] = [{ _id: 'all', categoryName: 'All Categories' }];
  selectedDirectItemsCategoryId: string = 'all';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private s3UploadService: S3UploadService,
    private itemService: ItemService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
    public router: Router,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      productName: ['', [Validators.required, Validators.maxLength(100)]],
      productDescription: ['', [Validators.required,Validators.maxLength(1000)]],
      productImage: [''],
      items: this.fb.array([])
    });
  }

  get items(): FormArray { return this.form.get('items') as FormArray; }

  ngOnInit(): void {
    // Initialize dropdown settings
    this.initializeDropdownSettings();
    
    // Initialize with one empty item
    this.addItem();
    this.loadItems();
    this.loadCategories();
  }

  private initializeDropdownSettings(): void {
    this.dropdownSettings = {
      singleSelection: true,
      idField: '_id',
      textField: 'itemName',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 1,
      allowSearchFilter: true,
      searchPlaceholderText: 'Search items...',
      noDataAvailablePlaceholderText: 'No items available',
      closeDropDownOnSelection: true,
      showSelectedItemsAtTop: true,
      maxHeight: 200,
      enableCheckAll: false,
      searchPlaceholder: 'Search items...',
      defaultOpen: false
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadItems(): void {
    this.loadingItems = true;
    this.itemService.getItems({ limit: 1000 }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.availableItems = response.data.items;
        this.loadingItems = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingItems = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadCategories(): void {
    this.loadingCategories = true;
    this.categoryService.listCategories(1, 100).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resp) => {
        this.categories = resp.items || [];
        // Build options array with "All Categories" and "Non-categorized" options
        this.categoryOptionsList = [
          { _id: 'all', categoryName: 'All Categories' },
          ...this.categories,
          { _id: 'non-categorized', categoryName: 'Non-categorized Items' }
        ];
        this.loadingCategories = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.categoryOptionsList = [
          { _id: 'all', categoryName: 'All Categories' },
          { _id: 'non-categorized', categoryName: 'Non-categorized Items' }
        ];
        this.loadingCategories = false;
        this.cdr.markForCheck();
      }
    });
  }

  onDirectItemsCategoryChange(): void {
    // Trigger change detection to update filtered items in dropdowns
    this.cdr.markForCheck();
  }

  addItem(): void {
    const itemsArray = this.form.get('items') as FormArray;
    itemsArray.push(this.fb.group({
      selectedItem: [null], // For ng-multiselect-dropdown
      itemId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.1)]]
    }));
    this.cdr.markForCheck();
  }

  removeItem(index: number): void {
    const itemsArray = this.form.get('items') as FormArray;
    if (itemsArray.length > 1) {
      itemsArray.removeAt(index);
    } else {
      // If only one item, clear it instead of removing
      const itemGroup = itemsArray.at(index) as FormGroup;
      itemGroup.patchValue({
        selectedItem: null,
        itemId: '',
        quantity: 1
      });
    }
    this.cdr.markForCheck();
  }

  getItemName(itemId: string): string {
    const item = this.availableItems.find(i => i._id === itemId);
    return item ? item.itemName : '';
  }

  private isItemAlreadySelected(itemId: string, currentIndex: number): boolean {
    const itemsArray = this.form.get('items') as FormArray;
    for (let i = 0; i < itemsArray.length; i++) {
      if (i !== currentIndex) {
        const itemGroup = itemsArray.at(i) as FormGroup;
        const existingItemId = itemGroup.get('itemId')?.value;
        if (existingItemId === itemId) {
          return true;
        }
      }
    }
    return false;
  }

  getAvailableItemsForIndex(index: number): Item[] {
    const itemsArray = this.form.get('items') as FormArray;
    const currentItemGroup = itemsArray.at(index) as FormGroup;
    const currentItemId = currentItemGroup.get('itemId')?.value;
    
    // Get all selected item IDs except the current one
    const selectedItemIds: string[] = [];
    for (let i = 0; i < itemsArray.length; i++) {
      if (i !== index) {
        const itemGroup = itemsArray.at(i) as FormGroup;
        const itemId = itemGroup.get('itemId')?.value;
        if (itemId && itemId.trim() !== '') {
          selectedItemIds.push(itemId);
        }
      }
    }
    
    // First filter by category if one is selected
    let categoryFilteredItems = this.availableItems;
    if (this.selectedDirectItemsCategoryId && 
        this.selectedDirectItemsCategoryId !== 'all' && 
        this.selectedDirectItemsCategoryId !== null) {
      if (this.selectedDirectItemsCategoryId === 'non-categorized') {
        // Show only non-categorized items
        categoryFilteredItems = this.availableItems.filter(item => 
          !item.categoryId || !item.categoryId._id
        );
      } else {
        // Filter by selected category
        categoryFilteredItems = this.availableItems.filter(item => {
          if (!item.categoryId) return false;
          const categoryId = typeof item.categoryId === 'string' ? item.categoryId : item.categoryId._id;
          return categoryId === this.selectedDirectItemsCategoryId;
        });
      }
    }
    
    // Filter out already selected items, but include the currently selected item
    return categoryFilteredItems.filter(item => 
      !selectedItemIds.includes(item._id) || item._id === currentItemId
    );
  }

  onItemSelect(item: any, index: number): void {
    const itemGroup = this.items.at(index) as FormGroup;
    
    // Check if this item is already selected in another row
    const isDuplicate = this.isItemAlreadySelected(item._id, index);
    if (isDuplicate) {
      // Clear the selection and show error
      itemGroup.patchValue({
        selectedItem: null,
        itemId: ''
      });
      // Set a custom error on the form control
      itemGroup.get('itemId')?.setErrors({ duplicate: true });
      return;
    }
    
    // Clear any previous duplicate error
    itemGroup.get('itemId')?.setErrors(null);
    
    itemGroup.patchValue({
      itemId: item._id
    });
  }

  onItemDeSelect(item: any, index: number): void {
    const itemGroup = this.items.at(index) as FormGroup;
    itemGroup.patchValue({
      itemId: ''
    });
    // Clear any duplicate errors when deselecting
    itemGroup.get('itemId')?.setErrors(null);
  }

  onSubmit(): void {
    if (this.submitting || this.form.invalid) return;
    this.submitting = true;

    const formValue = this.form.value;
    
    // Filter out items with empty itemId and format for API
    const validItems = formValue.items
      .filter((item: any) => item.itemId && item.itemId.trim() !== '')
      .map((item: any) => ({
        itemId: item.itemId,
        quantity: Number(item.quantity)
      }));

    const payload = {
      productName: formValue.productName,
      productDescription: formValue.productDescription,
      productImage: formValue.productImage,
      items: validItems
    };

    this.productService.createProduct(payload).subscribe({
      next: () => {
        this.toastService.success('Product created successfully!');
        this.router.navigate(['/products']);
      },
      error: () => (this.submitting = false)
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
    this.s3UploadService.uploadFile(file, 'products').subscribe({
      next: (url) => {
        this.form.patchValue({ productImage: url });
        this.uploading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.uploading = false;
        this.cdr.markForCheck();
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
    this.s3UploadService.uploadFile(file, 'products').subscribe({
      next: (url) => {
        this.form.patchValue({ productImage: url });
        this.uploading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.uploading = false;
        this.cdr.markForCheck();
      }
    });
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.imagePreviewUrl = null;
    this.form.patchValue({ productImage: '' });
    this.cdr.markForCheck();
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
  get productNameControl() { return this.form.get('productName') as FormControl; }
  get productDescriptionControl() { return this.form.get('productDescription') as FormControl; }
}


