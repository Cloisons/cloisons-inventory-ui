import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray, FormControl } from '@angular/forms';
import { ProjectService, ProjectStatus } from '../../core/services/project.service';
import { ContractorService, Contractor } from '../../core/services/contractor.service';
import { ProductService, Product } from '../../core/services/product.service';
import { ItemService, Item } from '../../core/services/item.service';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { CreateItemModalComponent } from '../../shared/components/create-item-modal/create-item-modal.component';
import { MatInputComponent } from '../../shared/components/mat-input/mat-input.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NgMultiSelectDropDownModule, CreateItemModalComponent, MatInputComponent, NgSelectModule],
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddProjectComponent implements OnInit, OnDestroy {
  form: FormGroup;
  submitting = false;
  contractors: Contractor[] = [];
  contractorOptions: any[] = [];
  availableProducts: Product[] = [];
  availableItems: Item[] = [];
  showCreateItemModal = false;
  loadingProducts = false;
  loadingItems = false;
  productDropdownSettings: any = null;
  itemDropdownSettings: any = null;
  private destroy$ = new Subject<void>();

  readonly statuses: { value: string; label: string }[] = [
    { value: 'PLANNING', label: 'Planning' }
  ];

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private contractorService: ContractorService,
    private productService: ProductService,
    private itemService: ItemService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.form = this.fb.group({
      projectName: ['', [Validators.required, Validators.maxLength(100)]],
      projectDescription: ['', [Validators.maxLength(1000)]],
      contractorId: ['', [Validators.required]],
      status: ['PLANNING', [Validators.required]],
      startDate: [null],
      products: this.fb.array([]),
      directItems: this.fb.array([])
    });

    this.initializeDropdownSettings();
  }

  ngOnInit(): void {
    this.loadContractors();
    this.loadProducts();
    this.loadItems();
    // Initialize with one empty product and direct item
    this.addProduct();
    this.addDirectItem();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeDropdownSettings(): void {
    this.productDropdownSettings = {
      singleSelection: true,
      idField: '_id',
      textField: 'productName',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 1,
      allowSearchFilter: true,
      searchPlaceholderText: 'Search products...',
      noDataAvailablePlaceholderText: 'No products available',
      closeDropDownOnSelection: true,
      showSelectedItemsAtTop: true,
      maxHeight: 200,
      enableCheckAll: false,
      searchPlaceholder: 'Search products...',
      defaultOpen: false
    };

    this.itemDropdownSettings = {
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

  onOpenCreateItemModal(): void {
    this.showCreateItemModal = true;
    this.cdr.markForCheck();
  }

  onCloseCreateItemModal(): void {
    this.showCreateItemModal = false;
    this.cdr.markForCheck();
  }

  onItemCreatedFromModal(item: Item): void {
    this.showCreateItemModal = false;
    // Refresh items to include newly created item (includes listedItem false)
    this.loadItems();
    this.cdr.markForCheck();
  }

  private loadContractors(): void {
    this.contractorService.listContractors(1, 100).subscribe({
      next: (items) => {
        this.contractors = items;
        this.contractorOptions = items.map(contractor => ({
          value: contractor._id,
          label: contractor.contractorName
        }));
      },
    });
  }

  private loadProducts(): void {
    this.loadingProducts = true;
    this.productService.listProductsPaged(1, 1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: { items: Product[]; meta?: any }) => {
        this.availableProducts = response.items;
        this.loadingProducts = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingProducts = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadItems(): void {
    this.loadingItems = true;
    this.itemService.getAllItems({ limit: 1000 }).pipe(
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

  // Form array getters
  get products(): FormArray { return this.form.get('products') as FormArray; }
  get directItems(): FormArray { return this.form.get('directItems') as FormArray; }


  // Product methods
  addProduct(): void {
    const productsArray = this.form.get('products') as FormArray;
    productsArray.push(this.fb.group({
      selectedProduct: [null], // For ng-multiselect-dropdown
      productId: [''],
      quantity: [1, [Validators.min(1)]]
    }));
    this.cdr.markForCheck();
  }

  removeProduct(index: number): void {
    const productsArray = this.form.get('products') as FormArray;
    if (productsArray.length > 1) {
      productsArray.removeAt(index);
    } else {
      // If only one product, clear it instead of removing
      const productGroup = productsArray.at(index) as FormGroup;
      productGroup.patchValue({
        selectedProduct: null,
        productId: '',
        quantity: 1
      });
    }
    this.cdr.markForCheck();
  }

  onProductSelect(product: any, index: number): void {
    const productGroup = this.products.at(index) as FormGroup;
    
    // Check if this product is already selected in another row
    const isDuplicate = this.isProductAlreadySelected(product._id, index);
    if (isDuplicate) {
      // Clear the selection and show error
      productGroup.patchValue({
        selectedProduct: null,
        productId: ''
      });
      // Set a custom error on the form control
      productGroup.get('productId')?.setErrors({ duplicate: true });
      return;
    }
    
    // Clear any previous duplicate error
    productGroup.get('productId')?.setErrors(null);
    
    productGroup.patchValue({
      productId: product._id
    });
  }

  onProductDeSelect(product: any, index: number): void {
    const productGroup = this.products.at(index) as FormGroup;
    productGroup.patchValue({
      productId: ''
    });
    // Clear any duplicate errors when deselecting
    productGroup.get('productId')?.setErrors(null);
  }

  private isProductAlreadySelected(productId: string, currentIndex: number): boolean {
    const productsArray = this.form.get('products') as FormArray;
    for (let i = 0; i < productsArray.length; i++) {
      if (i !== currentIndex) {
        const productGroup = productsArray.at(i) as FormGroup;
        const existingProductId = productGroup.get('productId')?.value;
        if (existingProductId === productId) {
          return true;
        }
      }
    }
    return false;
  }

  getAvailableProductsForIndex(index: number): Product[] {
    const productsArray = this.form.get('products') as FormArray;
    const currentProductGroup = productsArray.at(index) as FormGroup;
    const currentProductId = currentProductGroup.get('productId')?.value;
    
    // Get all selected product IDs except the current one
    const selectedProductIds: string[] = [];
    for (let i = 0; i < productsArray.length; i++) {
      if (i !== index) {
        const productGroup = productsArray.at(i) as FormGroup;
        const productId = productGroup.get('productId')?.value;
        if (productId && productId.trim() !== '') {
          selectedProductIds.push(productId);
        }
      }
    }
    
    // Filter out already selected products, but include the currently selected product
    return this.availableProducts.filter(product => 
      !selectedProductIds.includes(product._id) || product._id === currentProductId
    );
  }


  // Direct Items methods
  addDirectItem(): void {
    const directItemsArray = this.form.get('directItems') as FormArray;
    directItemsArray.push(this.fb.group({
      selectedItem: [null], // For ng-multiselect-dropdown
      itemId: [''],
      quantity: [1, [Validators.required, Validators.min(0.1)]]
    }));
    this.cdr.markForCheck();
  }

  removeDirectItem(index: number): void {
    const directItemsArray = this.form.get('directItems') as FormArray;
    if (directItemsArray.length > 1) {
      directItemsArray.removeAt(index);
    } else {
      // If only one item, clear it instead of removing
      const itemGroup = directItemsArray.at(index) as FormGroup;
      itemGroup.patchValue({
        selectedItem: null,
        itemId: '',
        quantity: 1
      });
    }
    this.cdr.markForCheck();
  }

  onDirectItemSelect(item: any, index: number): void {
    const itemGroup = this.directItems.at(index) as FormGroup;
    
    // Check if this item is already selected in another row
    const isDuplicate = this.isDirectItemAlreadySelected(item._id, index);
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

  onDirectItemDeSelect(item: any, index: number): void {
    const itemGroup = this.directItems.at(index) as FormGroup;
    itemGroup.patchValue({
      itemId: ''
    });
    // Clear any duplicate errors when deselecting
    itemGroup.get('itemId')?.setErrors(null);
  }

  private isDirectItemAlreadySelected(itemId: string, currentIndex: number): boolean {
    const directItemsArray = this.form.get('directItems') as FormArray;
    for (let i = 0; i < directItemsArray.length; i++) {
      if (i !== currentIndex) {
        const itemGroup = directItemsArray.at(i) as FormGroup;
        const existingItemId = itemGroup.get('itemId')?.value;
        if (existingItemId === itemId) {
          return true;
        }
      }
    }
    return false;
  }

  getAvailableDirectItemsForIndex(index: number): Item[] {
    const directItemsArray = this.form.get('directItems') as FormArray;
    const currentItemGroup = directItemsArray.at(index) as FormGroup;
    const currentItemId = currentItemGroup.get('itemId')?.value;
    
    // Get all selected item IDs except the current one
    const selectedItemIds: string[] = [];
    for (let i = 0; i < directItemsArray.length; i++) {
      if (i !== index) {
        const itemGroup = directItemsArray.at(i) as FormGroup;
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

  onSubmit(): void {
    if (this.submitting || this.form.invalid) return;
    this.submitting = true;

    const formValue = this.form.value;
    
    // Filter out products with empty productId and format for API
    const validProducts = formValue.products
      .filter((product: any) => product.productId && product.productId.trim() !== '')
      .map((product: any) => ({
        productId: product.productId,
        quantity: Number(product.quantity)
      }));

    // Filter out direct items with empty itemId and format for API
    const validDirectItems = formValue.directItems
      .filter((item: any) => item.itemId && item.itemId.trim() !== '')
      .map((item: any) => ({
        itemId: item.itemId,
        quantity: Number(item.quantity)
      }));

    const payload = {
      projectName: formValue.projectName,
      projectDescription: formValue.projectDescription,
      contractorId: formValue.contractorId,
      status: formValue.status,
      startDate: formValue.startDate,
      productsUsed: validProducts,
      directItemsUsed: validDirectItems
    };

    this.projectService.createProject(payload).subscribe({
      next: () => this.router.navigate(['/projects']),
      error: () => (this.submitting = false),
    });
  }

  // Getter methods for form controls to ensure proper typing
  get projectNameControl() { return this.form.get('projectName') as FormControl; }
  get projectDescriptionControl() { return this.form.get('projectDescription') as FormControl; }
  get contractorIdControl() { return this.form.get('contractorId') as FormControl; }
  get statusControl() { return this.form.get('status') as FormControl; }
  get startDateControl() { return this.form.get('startDate') as FormControl; }
}


