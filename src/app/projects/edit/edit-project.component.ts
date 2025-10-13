import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { ProjectService, Project, ProjectStatus } from '../../core/services/project.service';
import { ContractorService, Contractor } from '../../core/services/contractor.service';
import { ProductService, Product } from '../../core/services/product.service';
import { ItemService, Item } from '../../core/services/item.service';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-edit-project',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NgMultiSelectDropDownModule],
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditProjectComponent implements OnInit, OnDestroy {
  form: FormGroup;
  submitting = false;
  loading = true;
  projectId = '';
  project: Project | null = null;
  errorMessage = '';
  contractors: Contractor[] = [];
  availableProducts: Product[] = [];
  availableItems: Item[] = [];
  loadingProducts = false;
  loadingItems = false;
  productDropdownSettings: any = null;
  itemDropdownSettings: any = null;
  private pendingProjectProducts: any[] = [];
  private pendingProjectItems: any[] = [];
  private destroy$ = new Subject<void>();
  private originalStatus: ProjectStatus | null = null;
  private hasStatusChangedFromPlanning = false;

  readonly statuses: ProjectStatus[] = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'CANCELLED', 'COMPLETED'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
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
      items: this.fb.array([])
    });

    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.initializeDropdownSettings();
  }

  ngOnInit(): void {
    if (this.projectId) {
      this.loadContractors();
      this.loadProducts();
      this.loadProject();
    } else {
      this.router.navigate(['/projects']);
    }
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
        this.setProductsIfReady();
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingProducts = false;
        this.cdr.markForCheck();
      }
    });
  }

  // private loadItems(): void {
  //   this.loadingItems = true;
  //   this.itemService.getItems({ limit: 1000 }).pipe(
  //     takeUntil(this.destroy$)
  //   ).subscribe({
  //     next: (response) => {
  //       this.availableItems = response.data.items;
  //       this.loadingItems = false;
  //       this.setItemsIfReady();
  //       this.cdr.markForCheck();
  //     },
  //     error: () => {
  //       this.loadingItems = false;
  //       this.cdr.markForCheck();
  //     }
  //   });
  // }

  private loadProject(): void {
    this.projectService.getProject(this.projectId).subscribe({
      next: (project) => {
        this.project = project;
        this.originalStatus = project.status;
        this.hasStatusChangedFromPlanning = project.status !== 'PLANNING';
        
        const contractorId = (project.contractorId as any)?._id || project.contractorId;
        this.form.patchValue({
          projectName: project.projectName,
          projectDescription: project.projectDescription || '',
          contractorId: contractorId,
          status: project.status,
          startDate: this.formatDateForInput(project.startDate)
        });

        // Set products and items for existing project
        if (project.productsUsed && project.productsUsed.length > 0) {
          this.pendingProjectProducts = project.productsUsed;
          this.setProductsIfReady();
        } else {
          this.addProduct();
        }

        // if (project.itemsUsed && project.itemsUsed.length > 0) {
        //   this.pendingProjectItems = project.itemsUsed;
        //   this.setItemsIfReady();
        // } else {
        //   this.addItem();
        // }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Failed to load project';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private setProductsIfReady(): void {
    if (this.pendingProjectProducts.length > 0 && this.availableProducts.length > 0) {
      this.setProductsFromProject(this.pendingProjectProducts);
      this.pendingProjectProducts = [];
    }
  }

  // private setItemsIfReady(): void {
  //   if (this.pendingProjectItems.length > 0 && this.availableItems.length > 0) {
  //     this.setItemsFromProject(this.pendingProjectItems);
  //     this.pendingProjectItems = [];
  //   }
  // }

  private setProductsFromProject(projectProducts: any[]): void {
    const productsArray = this.form.get('products') as FormArray;
    productsArray.clear();
    
    if (projectProducts.length === 0) {
      this.addProduct();
    } else {
      projectProducts.forEach((projectProduct) => {
        const productId = typeof projectProduct.productId === 'string' 
          ? projectProduct.productId 
          : projectProduct.productId?._id;
        
        const fullProduct = this.availableProducts.filter(product => product._id === productId);
        debugger
        if (fullProduct) {
          const formGroup = this.fb.group({
            selectedProduct: [fullProduct],
            productId: [productId, Validators.required],
            quantity: [projectProduct.quantity || 1, [Validators.required, Validators.min(1)]]
          });
          
          productsArray.push(formGroup);
          
          setTimeout(() => {
            formGroup.get('selectedProduct')?.updateValueAndValidity();
          }, 100);
        }
      });
    }
    
    this.cdr.detectChanges();
    setTimeout(() => {
      this.cdr.markForCheck();
    }, 200);
  }

  // private setItemsFromProject(projectItems: any[]): void {
  //   const itemsArray = this.form.get('items') as FormArray;
  //   itemsArray.clear();
    
  //   if (projectItems.length === 0) {
  //     this.addItem();
  //   } else {
  //     projectItems.forEach((projectItem) => {
  //       const itemId = typeof projectItem.itemId === 'string' 
  //         ? projectItem.itemId 
  //         : projectItem.itemId?._id;
        
  //       const fullItem = this.availableItems.filter(item => item._id === itemId);
        
  //       if (fullItem) {
  //         const formGroup = this.fb.group({
  //           selectedItem: [fullItem],
  //           itemId: [itemId, Validators.required],
  //           quantity: [projectItem.quantity || 1, [Validators.required, Validators.min(1)]]
  //         });
          
  //         itemsArray.push(formGroup);
          
  //         setTimeout(() => {
  //           formGroup.get('selectedItem')?.updateValueAndValidity();
  //         }, 100);
  //       }
  //     });
  //   }
    
  //   this.cdr.detectChanges();
  //   setTimeout(() => {
  //     this.cdr.markForCheck();
  //   }, 200);
  // }

  // Form array getters
  get products(): FormArray { return this.form.get('products') as FormArray; }
  // get items(): FormArray { return this.form.get('items') as FormArray; }

  // Business rule methods
  get canChangeStatusToPlanning(): boolean {
    return !this.hasStatusChangedFromPlanning;
  }

  get canEditProducts(): boolean {
    const currentStatus = this.form.get('status')?.value;
    return currentStatus === 'PLANNING';
  }

  get availableStatuses(): ProjectStatus[] {
    if (this.hasStatusChangedFromPlanning) {
      return this.statuses.filter(status => status !== 'PLANNING');
    }
    return this.statuses;
  }

  onStatusChange(): void {
    const currentStatus = this.form.get('status')?.value;
    if (this.originalStatus === 'PLANNING' && currentStatus !== 'PLANNING') {
      this.hasStatusChangedFromPlanning = true;
    }
    this.cdr.markForCheck();
  }

  // Product methods
  addProduct(): void {
    if (!this.canEditProducts) {
      return;
    }
    const productsArray = this.form.get('products') as FormArray;
    productsArray.push(this.fb.group({
      selectedProduct: [null],
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    }));
    this.cdr.markForCheck();
  }

  removeProduct(index: number): void {
    if (!this.canEditProducts) {
      return;
    }
    const productsArray = this.form.get('products') as FormArray;
    if (productsArray.length > 1) {
      productsArray.removeAt(index);
    } else {
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
    if (!this.canEditProducts) {
      return;
    }
    const productGroup = this.products.at(index) as FormGroup;
    
    const isDuplicate = this.isProductAlreadySelected(product._id, index);
    if (isDuplicate) {
      productGroup.patchValue({
        selectedProduct: null,
        productId: ''
      });
      productGroup.get('productId')?.setErrors({ duplicate: true });
      return;
    }
    
    productGroup.get('productId')?.setErrors(null);
    productGroup.patchValue({
      productId: product._id
    });
  }

  onProductDeSelect(product: any, index: number): void {
    if (!this.canEditProducts) {
      return;
    }
    const productGroup = this.products.at(index) as FormGroup;
    productGroup.patchValue({
      productId: ''
    });
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
    
    return this.availableProducts.filter(product => 
      !selectedProductIds.includes(product._id) || product._id === currentProductId
    );
  }

  getProductName(productId: string): string {
    const product = this.availableProducts.find(p => p._id === productId);
    return product ? product.productName : 'Unknown Product';
  }

  private formatDateForInput(dateString: string | null | undefined): string | null {
    if (!dateString) {
      return null;
    }
    
    try {
      // Create a Date object from the string
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return null;
      }
      
      // Format as YYYY-MM-DD for HTML date input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.warn('Error formatting date:', error);
      return null;
    }
  }

  // Item methods
  addItem(): void {
    const itemsArray = this.form.get('items') as FormArray;
    itemsArray.push(this.fb.group({
      selectedItem: [null],
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
      const itemGroup = itemsArray.at(index) as FormGroup;
      itemGroup.patchValue({
        selectedItem: null,
        itemId: '',
        quantity: 1
      });
    }
    this.cdr.markForCheck();
  }

  // onItemSelect(item: any, index: number): void {
  //   const itemGroup = this.items.at(index) as FormGroup;
    
  //   const isDuplicate = this.isItemAlreadySelected(item._id, index);
  //   if (isDuplicate) {
  //     itemGroup.patchValue({
  //       selectedItem: null,
  //       itemId: ''
  //     });
  //     itemGroup.get('itemId')?.setErrors({ duplicate: true });
  //     return;
  //   }
    
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
    
  //   return this.availableItems.filter(item => 
  //     !selectedItemIds.includes(item._id) || item._id === currentItemId
  //   );
  // }

  onSubmit(): void {
    if (this.submitting || this.form.invalid || !this.project) return;
    this.submitting = true;

    const formValue = this.form.value;
    
    const validProducts = formValue.products
      .filter((product: any) => product.productId && product.productId.trim() !== '')
      .map((product: any) => ({
        productId: product.productId,
        quantity: parseInt(product.quantity, 10)
      }));

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

    if(payload.status !== "PLANNING") {
     delete payload.productsUsed
    }

    this.projectService.updateProject(this.projectId, payload).subscribe({
      next: () => this.router.navigate(['/projects']),
      error: () => (this.submitting = false),
    });
  }
}


