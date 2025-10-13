import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { ProjectService, ProjectStatus } from '../../core/services/project.service';
import { ContractorService, Contractor } from '../../core/services/contractor.service';
import { ProductService, Product } from '../../core/services/product.service';
import { ItemService, Item } from '../../core/services/item.service';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NgMultiSelectDropDownModule],
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddProjectComponent implements OnInit, OnDestroy {
  form: FormGroup;
  submitting = false;
  contractors: Contractor[] = [];
  availableProducts: Product[] = [];
  availableItems: Item[] = [];
  loadingProducts = false;
  loadingItems = false;
  productDropdownSettings: any = null;
  itemDropdownSettings: any = null;
  private destroy$ = new Subject<void>();

  readonly statuses: ProjectStatus[] = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'CANCELLED', 'COMPLETED'];

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
      // items: this.fb.array([])
    });

    this.initializeDropdownSettings();
  }

  ngOnInit(): void {
    this.loadContractors();
    this.loadProducts();
    // this.loadItems();
    // Initialize with one empty product and item
    this.addProduct();
    // this.addItem();
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

  private loadContractors(): void {
    this.contractorService.listContractors(1, 100).subscribe({
      next: (items) => (this.contractors = items),
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

  // Form array getters
  get products(): FormArray { return this.form.get('products') as FormArray; }
  get items(): FormArray { return this.form.get('items') as FormArray; }


  // Product methods
  addProduct(): void {
    const productsArray = this.form.get('products') as FormArray;
    productsArray.push(this.fb.group({
      selectedProduct: [null], // For ng-multiselect-dropdown
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
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


  // Item methods
  // addItem(): void {
  //   const itemsArray = this.form.get('items') as FormArray;
  //   itemsArray.push(this.fb.group({
  //     selectedItem: [null], // For ng-multiselect-dropdown
  //     itemId: ['', Validators.required],
  //     quantity: [1, [Validators.required, Validators.min(1)]]
  //   }));
  //   this.cdr.markForCheck();
  // }

  // removeItem(index: number): void {
  //   const itemsArray = this.form.get('items') as FormArray;
  //   if (itemsArray.length > 1) {
  //     itemsArray.removeAt(index);
  //   } else {
  //     // If only one item, clear it instead of removing
  //     const itemGroup = itemsArray.at(index) as FormGroup;
  //     itemGroup.patchValue({
  //       selectedItem: null,
  //       itemId: '',
  //       quantity: 1
  //     });
  //   }
  //   this.cdr.markForCheck();
  // }

  // onItemSelect(item: any, index: number): void {
  //   const itemGroup = this.items.at(index) as FormGroup;
    
  //   // Check if this item is already selected in another row
  //   const isDuplicate = this.isItemAlreadySelected(item._id, index);
  //   if (isDuplicate) {
  //     // Clear the selection and show error
  //     itemGroup.patchValue({
  //       selectedItem: null,
  //       itemId: ''
  //     });
  //     // Set a custom error on the form control
  //     itemGroup.get('itemId')?.setErrors({ duplicate: true });
  //     return;
  //   }
    
  //   // Clear any previous duplicate error
  //   itemGroup.get('itemId')?.setErrors(null);
    
  //   itemGroup.patchValue({
  //     itemId: item._id
  //   });
  // }

  // onItemDeSelect(item: any, index: number): void {
  //   const itemGroup = this.items.at(index) as FormGroup;
  //   itemGroup.patchValue({
  //     itemId: ''
  //   });
  //   // Clear any duplicate errors when deselecting
  //   itemGroup.get('itemId')?.setErrors(null);
  // }

  // private isItemAlreadySelected(itemId: string, currentIndex: number): boolean {
  //   const itemsArray = this.form.get('items') as FormArray;
  //   for (let i = 0; i < itemsArray.length; i++) {
  //     if (i !== currentIndex) {
  //       const itemGroup = itemsArray.at(i) as FormGroup;
  //       const existingItemId = itemGroup.get('itemId')?.value;
  //       if (existingItemId === itemId) {
  //         return true;
  //       }
  //     }
  //   }
  //   return false;
  // }

  // getAvailableItemsForIndex(index: number): Item[] {
  //   const itemsArray = this.form.get('items') as FormArray;
  //   const currentItemGroup = itemsArray.at(index) as FormGroup;
  //   const currentItemId = currentItemGroup.get('itemId')?.value;
    
  //   // Get all selected item IDs except the current one
  //   const selectedItemIds: string[] = [];
  //   for (let i = 0; i < itemsArray.length; i++) {
  //     if (i !== index) {
  //       const itemGroup = itemsArray.at(i) as FormGroup;
  //       const itemId = itemGroup.get('itemId')?.value;
  //       if (itemId && itemId.trim() !== '') {
  //         selectedItemIds.push(itemId);
  //       }
  //     }
  //   }
    
  //   // Filter out already selected items, but include the currently selected item
  //   return this.availableItems.filter(item => 
  //     !selectedItemIds.includes(item._id) || item._id === currentItemId
  //   );
  // }

  onSubmit(): void {
    if (this.submitting || this.form.invalid) return;
    this.submitting = true;

    const formValue = this.form.value;
    
    // Filter out products with empty productId and format for API
    const validProducts = formValue.products
      .filter((product: any) => product.productId && product.productId.trim() !== '')
      .map((product: any) => ({
        productId: product.productId,
        quantity: parseInt(product.quantity, 10)
      }));

    // Filter out items with empty itemId and format for API
    // const validItems = formValue.items
    //   .filter((item: any) => item.itemId && item.itemId.trim() !== '')
    //   .map((item: any) => ({
    //     itemId: item.itemId,
    //     quantity: parseInt(item.quantity, 10)
    //   }));

    const payload = {
      projectName: formValue.projectName,
      projectDescription: formValue.projectDescription,
      contractorId: formValue.contractorId,
      status: formValue.status,
      startDate: formValue.startDate,
      productsUsed: validProducts,
      // itemsUsed: validItems
    };

    this.projectService.createProject(payload).subscribe({
      next: () => this.router.navigate(['/projects']),
      error: () => (this.submitting = false),
    });
  }
}


