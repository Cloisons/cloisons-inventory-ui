import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { MatInputComponent } from '../../shared/components/mat-input/mat-input.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { ProductService, Product } from '../../core/services/product.service';
import { S3UploadService } from '../../shared/services/s3-upload.service';
import { ItemService, Item } from '../../core/services/item.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, MatInputComponent, NgMultiSelectDropDownModule],
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditProductComponent implements OnInit, OnDestroy {
  form: FormGroup;
  submitting = false;
  loading = true;
  product: Product | null = null;
  errorMessage = '';
  uploading = false;
  imagePreviewUrl: string | null = null;
  uploadError: string = '';
  availableItems: Item[] = [];
  loadingItems = false;
  dropdownSettings: any = null;
  private pendingProductItems: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private s3UploadService: S3UploadService,
    private itemService: ItemService,
    public router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      productName: ['', [Validators.required, Validators.maxLength(100)]],
      productDescription: ['', [Validators.maxLength(1000)]],
      productImage: ['', [Validators.maxLength(500)]],
      items: this.fb.array([])
    });
  }

  ngOnInit(): void {
    // Initialize dropdown settings
    this.initializeDropdownSettings();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/products']);
      return;
    }

    // Initialize with one empty item
    this.addItem();

    // Load items first, then load product
    this.loadItems();
    this.loadProduct(id);
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

  private loadProduct(id: string): void {
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product = product;
        this.form.patchValue({
          productName: product.productName,
          productDescription: product.productDescription || '',
          productImage: product.productImage || ''
        });
        // Set preview for existing image
        if (product.productImage) {
          this.imagePreviewUrl = product.productImage;
        }
        // Set items for existing product (will be called after items are loaded)
        if (product.items && product.items.length > 0) {
          this.pendingProductItems = product.items;
          this.setItemsIfReady();
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Failed to load product';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
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
        console.log('Loaded available items:', this.availableItems);
        // Check if we have pending product items to set
        this.setItemsIfReady();
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingItems = false;
        this.cdr.markForCheck();
      }
    });
  }

  private setItemsIfReady(): void {
    if (this.pendingProductItems.length > 0 && this.availableItems.length > 0) {
      console.log('Setting items from product:', this.pendingProductItems);
      console.log('Available items:', this.availableItems);
      this.setItemsFromProduct(this.pendingProductItems);
      this.pendingProductItems = []; // Clear pending items
    }
  }

  setItemsFromProduct(productItems: any[]): void {
    const itemsArray = this.form.get('items') as FormArray;
    itemsArray.clear();
    
    if (productItems.length === 0) {
      // If no items, add one empty item
      this.addItem();
    } else {
      productItems.forEach((productItem, index) => {
        // Handle both cases: itemId as string or as object with _id
        const itemId = typeof productItem.itemId === 'string' 
          ? productItem.itemId 
          : productItem.itemId?._id;
        
        console.log(`Processing product item ${index}:`, productItem);
        console.log(`Extracted itemId:`, itemId);
        
        const fullItem = this.availableItems.filter(item => item._id === itemId);
        debugger
        
        if (fullItem) {
          const quantity = productItem.quantity || 1;
          console.log(`Full item:`, fullItem);
          const formGroup = this.fb.group({
            selectedItem: [fullItem], // For ng-multiselect-dropdown
            itemId: [itemId, Validators.required],
            quantity: [quantity, [Validators.required, Validators.min(1)]]
          });
          
          console.log(`Created form group:`, formGroup.value);
          itemsArray.push(formGroup);
          
          // Force update the form control to ensure dropdown shows the selected item
          setTimeout(() => {
            formGroup.get('selectedItem')?.updateValueAndValidity();
          }, 100);
        } else {
          console.warn(`Item not found for ID: ${itemId}`);
        }
      });
    }
    
    // Force change detection and update dropdowns
    this.cdr.detectChanges();
    
    // Additional delay to ensure dropdowns are rendered
    setTimeout(() => {
      this.cdr.markForCheck();
    }, 200);
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

  addItem(): void {
    const itemsArray = this.form.get('items') as FormArray;
    itemsArray.push(this.fb.group({
      selectedItem: [null], // For ng-multiselect-dropdown
      itemId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
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
    
    // Filter out already selected items, but include the currently selected item
    return this.availableItems.filter(item => 
      !selectedItemIds.includes(item._id) || item._id === currentItemId
    );
  }


  get items(): FormArray { return this.form.get('items') as FormArray; }

  onSubmit(): void {
    if (this.submitting || this.form.invalid || !this.product) return;
    this.submitting = true;

    const formValue = this.form.value;
    debugger
    
    // Filter out items with empty itemId and format for API
    const validItems = formValue.items
      .filter((item: any) => item.itemId && item.itemId.trim() !== '')
      .map((item: any) => ({
        itemId: item.itemId,
        quantity: parseInt(item.quantity, 10)
      }));

    const payload = {
      productName: formValue.productName,
      productDescription: formValue.productDescription,
      productImage: formValue.productImage,
      items: validItems
    };

    this.productService.updateProduct(this.product._id, payload).subscribe({
      next: () => this.router.navigate(['/products']),
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
}
