import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, TrackByFunction, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { finalize, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ItemService, Item, StockAdditionRequest } from '../core/services/item.service';
import { CategoryService, Category } from '../core/services/category.service';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';
// Removed Material autocomplete in favor of Ng Select
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../shared/components/confirm-dialog/confirm-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatInputComponent } from '../shared/components/mat-input/mat-input.component';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

// Interfaces for expandable table
interface CategoryRow {
  id: string;
  name: string;
  isNonCategorized: boolean;
  categoryId: string | null;
}

interface CategoryItemData {
  items: Item[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  isLoading: boolean;
  errorMessage: string;
}

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    NgSelectModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatDialogModule, 
    MatInputComponent,
    MatTableModule,
    MatExpansionModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './items.component.html',
  styleUrl: './items.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsComponent implements OnInit, OnDestroy {
  // Public properties
  items: Item[] = [];
  selectedImage: string = '';
  showModal: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  isLoading: boolean = false;
  isSearching: boolean = false;
  searchQuery: string = '';
  selectedCategoryId: string = 'all';
  categories: Category[] = [];
  categoryOptionsList: any[] = [{ _id: 'all', categoryName: 'All Categories' }];
  errorMessage: string = '';
  isSuperAdmin = false;
  isUser2 = false;
  
  // Expandable table properties
  categoryRows: CategoryRow[] = [];
  expandedCategories: Set<string> = new Set();
  categoryItemsMap: Map<string, CategoryItemData> = new Map();
  displayedColumns: string[] = ['itemName', 'itemCode', 'image', 'description', 'supplierId', 'unitScale', 'availableQty', 'sellingCost', 'actions'];
  
  // Stock management properties
  showStockModal: boolean = false;
  selectedStockItem: string = '';
  selectedStockCategoryId: string = 'all';
  availableStock: number = 0;
  stockQuantity: number = 0;
  unitCost: number = 0;
  sellingCost: number = 0;
  stockNotes: string = '';
  
  // Stock item select properties (Ng Select)
  allStockItems: Item[] = [];
  filteredStockItems: Item[] = [];
  
  // Image handling
  readonly NO_IMAGE_PLACEHOLDER = '/assets/images/no-image-placeholder.svg';
  imageErrors: Set<string> = new Set(); // Track which images failed to load
  
  // Private properties
  private searchTimeout?: number;
  private destroy$ = new Subject<void>();
  
  // Template utilities
  readonly Math = Math; // Expose Math object to template

  constructor(
    private itemService: ItemService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private toastService: ToastService
  ) {
    this.isSuperAdmin = this.authService.hasRole('superAdmin');
    this.isUser2 = this.authService.hasRole('user2');
  }

  ngOnInit(): void {
    console.log('🔍 ItemsComponent: ngOnInit() called');
    console.log('🔍 Auth status on init:', this.authService.isAuthenticated());
    console.log('🔍 Current user on init:', this.authService.getCurrentUser());
    
    // Load categories and build expandable table structure
    this.loadCategories();
    
    // Load all items for stock management
    this.loadAllItems();
    
    // Update displayed columns based on user role
    if (this.isUser2) {
      this.displayedColumns = this.displayedColumns.filter(col => col !== 'sellingCost');
    }
  }

  loadCategories(): void {
    this.categoryService.listCategories(1, 100).subscribe({
      next: (resp) => {
        this.categories = resp.items || [];
        // Build options array with "All Categories" and "Non-categorized" options
        this.categoryOptionsList = [
          { _id: 'all', categoryName: 'All Categories' },
          ...this.categories,
          { _id: 'non-categorized', categoryName: 'Non-categorized Items' }
        ];
        console.log('🔍 Categories loaded:', this.categories.length);
        console.log('🔍 Category options:', this.categoryOptionsList);
        
        // Build category rows for expandable table
        this.buildCategoryRows();
        
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
        this.categoryOptionsList = [
          { _id: 'all', categoryName: 'All Categories' },
          { _id: 'non-categorized', categoryName: 'Non-categorized Items' }
        ];
        this.buildCategoryRows();
      }
    });
  }
  
  buildCategoryRows(): void {
    this.categoryRows = [];
    
    // Add category rows first
    this.categories.forEach(category => {
      const categoryRow: CategoryRow = {
        id: category._id,
        name: category.categoryName || 'Unnamed Category',
        isNonCategorized: false,
        categoryId: category._id
      };
      this.categoryRows.push(categoryRow);
      
      // Expand all categories by default
      this.expandedCategories.add(category._id);
      // Load items for each category
      this.loadCategoryItems(categoryRow);
    });
    
    // Add non-categorized row at the end
    const nonCategorizedRow: CategoryRow = {
      id: 'non-categorized',
      name: 'Non-categorized Items',
      isNonCategorized: true,
      categoryId: null
    };
    this.categoryRows.push(nonCategorizedRow);
    
    // Expand non-categorized row by default
    this.expandedCategories.add('non-categorized');
    // Load items for non-categorized row
    this.loadCategoryItems(nonCategorizedRow);
    
    this.cdr.markForCheck();
  }
  
  onPanelOpened(categoryRow: CategoryRow): void {
    // Panel was opened - ensure it's in our expanded set and load items
    if (!this.expandedCategories.has(categoryRow.id)) {
      this.expandedCategories.add(categoryRow.id);
    }
    this.loadCategoryItems(categoryRow);
    this.cdr.markForCheck();
  }
  
  onPanelClosed(categoryRow: CategoryRow): void {
    // Panel was closed - remove from expanded set
    this.expandedCategories.delete(categoryRow.id);
    this.cdr.markForCheck();
  }
  
  toggleCategory(categoryRow: CategoryRow): void {
    const isExpanded = this.expandedCategories.has(categoryRow.id);
    
    if (isExpanded) {
      // Collapse
      this.expandedCategories.delete(categoryRow.id);
    } else {
      // Expand - load items for this category
      this.expandedCategories.add(categoryRow.id);
      this.loadCategoryItems(categoryRow);
    }
    
    this.cdr.markForCheck();
  }
  
  isCategoryExpanded(categoryId: string): boolean {
    return this.expandedCategories.has(categoryId);
  }
  
  loadCategoryItems(categoryRow: CategoryRow, forceReload: boolean = false): void {
    // Initialize category data if it doesn't exist
    let categoryData = this.categoryItemsMap.get(categoryRow.id);
    if (!categoryData) {
      categoryData = {
        items: [],
        currentPage: 1,
        totalItems: 0,
        totalPages: 0,
        isLoading: false,
        errorMessage: ''
      };
      this.categoryItemsMap.set(categoryRow.id, categoryData);
    }
    
    // Check if already loaded (unless force reload)
    // Also reload if page, search query, or category has changed
    const currentParams = {
      page: categoryData.currentPage,
      search: this.searchQuery,
      categoryId: categoryRow.isNonCategorized ? 'non-categorized' : categoryRow.categoryId
    };
    const lastParams = (categoryData as any).lastParams;
    
    if (!forceReload && categoryData.items.length > 0 && !categoryData.isLoading) {
      // Check if params have changed
      if (lastParams && 
          lastParams.page === currentParams.page &&
          lastParams.search === currentParams.search &&
          lastParams.categoryId === currentParams.categoryId) {
        return; // Already loaded with same params
      }
    }
    
    // Store current params for next comparison
    (categoryData as any).lastParams = currentParams;
    
    categoryData.isLoading = true;
    categoryData.errorMessage = '';
    this.cdr.markForCheck();
    
    // Build API params
    const params: any = {
      page: categoryData.currentPage,
      limit: this.itemsPerPage,
      search: this.searchQuery
    };
    
    // For non-categorized, pass 'non-categorized' as categoryId
    // For categories, pass the actual categoryId
    if (categoryRow.isNonCategorized) {
      params.categoryId = 'non-categorized';
    } else if (categoryRow.categoryId) {
      params.categoryId = categoryRow.categoryId;
    }
    
    this.itemService.getItems(params).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        categoryData.isLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const items = response.data.items || [];
          
          // Use API response metadata for pagination
          categoryData.totalItems = response.meta?.total || 0;
          categoryData.totalPages = response.meta?.totalPages || 0;
          categoryData.items = items;
          
          this.cdr.markForCheck();
        } else {
          categoryData.errorMessage = 'Failed to load items. Please try again.';
          categoryData.items = [];
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        console.error('Error loading category items:', error);
        categoryData.errorMessage = 'Failed to load items. Please try again.';
        categoryData.items = [];
        this.cdr.markForCheck();
      }
    });
  }
  
  onCategoryPageChange(categoryId: string, page: number): void {
    const categoryData = this.categoryItemsMap.get(categoryId);
    if (!categoryData) return;
    
    if (page >= 1 && page <= categoryData.totalPages) {
      categoryData.currentPage = page;
      const categoryRow = this.categoryRows.find(r => r.id === categoryId);
      if (categoryRow) {
        this.loadCategoryItems(categoryRow, true); // Force reload when page changes
      }
    }
  }
  
  getCategoryItems(categoryId: string): MatTableDataSource<Item> {
    const categoryData = this.categoryItemsMap.get(categoryId);
    const items = categoryData ? categoryData.items : [];
    return new MatTableDataSource<Item>(items);
  }
  
  getCategoryPageRange(categoryId: string): number[] {
    const pageInfo = this.getCategoryPageInfo(categoryId);
    const pages: number[] = [];
    const startPage = Math.max(1, pageInfo.currentPage - 2);
    const endPage = Math.min(pageInfo.totalPages, pageInfo.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  trackByCategoryId: TrackByFunction<CategoryRow> = (index: number, categoryRow: CategoryRow): string => {
    return categoryRow.id;
  };
  
  getCategoryPageInfo(categoryId: string): { currentPage: number; totalPages: number; totalItems: number } {
    const categoryData = this.categoryItemsMap.get(categoryId);
    if (!categoryData) {
      return { currentPage: 1, totalPages: 0, totalItems: 0 };
    }
    return {
      currentPage: categoryData.currentPage,
      totalPages: categoryData.totalPages,
      totalItems: categoryData.totalItems
    };
  }
  
  isCategoryLoading(categoryId: string): boolean {
    const categoryData = this.categoryItemsMap.get(categoryId);
    return categoryData ? categoryData.isLoading : false;
  }
  
  getCategoryErrorMessage(categoryId: string): string {
    const categoryData = this.categoryItemsMap.get(categoryId);
    return categoryData ? categoryData.errorMessage : '';
  }

  loadAllItems(): void {
    this.itemService.getItems({
      page: 1,
      limit: 1000,
      search: ''
    }).subscribe((response) => {
      this.allStockItems = response.data.items || [];
      this.filterStockItems(); // Filter items based on current category selection
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }


  loadItems(): void {
    
    // Check if user is authenticated before making the API call
    if (!this.authService.isAuthenticated()) {
      console.warn('User is not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck(); // Trigger change detection for loading state
    
    this.itemService.getItems({
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchQuery,
      categoryId: this.selectedCategoryId
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoading = false;
        this.isSearching = false;
        console.log('🔍 API call completed, isLoading set to false');
        this.cdr.markForCheck(); // Trigger change detection
      })
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.items = response.data.items || [];
          // this.allStockItems = response.data.items || []; // Populate stock items for autocomplete
          this.totalItems = response.meta?.total || 0;
          this.totalPages = response.meta?.totalPages || 0;
          console.log('🔍 Items loaded successfully:', this.items.length, 'items');
          
          // No filter init needed; using Ng Select with built-in search
          
          this.cdr.markForCheck(); // Trigger change detection
        } else {
          console.error('🔍 API response indicates failure:', response);
          this.errorMessage = 'Failed to load items. Please try again.';
          this.items = [];
          this.cdr.markForCheck(); // Trigger change detection
        }
      },
      error: (error) => {
        console.error('🔍 Error loading items:', error);
        this.handleLoadItemsError(error);
      }
    });
  }

  private handleLoadItemsError(error: any): void {
    if (error.status === 401) {
      this.router.navigate(['/login']);
    } else if (error.status === 403) {
      this.errorMessage = 'You do not have permission to view items.';
    } else if (error.status === 0) {
      this.errorMessage = 'Network error. Please check your connection.';
    } else if (error.status >= 500) {
      this.errorMessage = 'Server error. Please try again later.';
    } else {
      this.errorMessage = 'Failed to load items. Please try again.';
    }
    this.items = [];
    this.cdr.markForCheck(); // Trigger change detection
  }

  openImageModal(image: string): void {
    this.selectedImage = image;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedImage = '';
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadItems();
    }
  }


  get paginatedItems(): Item[] {
    return this.items;
  }

  get pageRange(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  onView(item: Item): void {
    this.router.navigate(['/items', item._id]);
  }

  onEdit(item: Item): void {
    this.router.navigate(['/items', item._id, 'edit']);
  }

  onDelete(item: Item): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Item',
        message: `Are you sure you want to delete "${item.itemName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed) => {
      if (!confirmed) return;
      this.isLoading = true;
      this.errorMessage = '';
      
      this.itemService.deleteItem(item._id).pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Item deleted successfully:', response);
            // Refresh all expanded categories
            this.expandedCategories.forEach(categoryId => {
              const categoryRow = this.categoryRows.find(r => r.id === categoryId);
              if (categoryRow) {
                this.loadCategoryItems(categoryRow, true); // Force reload
              }
            });
            this.cdr.markForCheck();
          } else {
            this.errorMessage = 'Failed to delete item. Please try again.';
          }
        },
        error: (error) => {
          console.error('Error deleting item:', error);
          this.handleDeleteError(error);
        }
      });
    });
  }

  private handleDeleteError(error: any): void {
    if (error.status === 401) {
      this.router.navigate(['/login']);
    } else if (error.status === 403) {
      this.errorMessage = 'You do not have permission to delete items.';
    } else if (error.status === 404) {
      this.errorMessage = 'Item not found. It may have been deleted already.';
    } else if (error.status >= 500) {
      this.errorMessage = 'Server error. Please try again later.';
    } else {
      this.errorMessage = 'Failed to delete item. Please try again.';
    }
  }

  // Helper method to check if user role is 'user'
  get isUserRole(): boolean {
    return this.authService.hasRole('user');
  }

  // Helper method to check if user is authenticated
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  // Helper method to get supplier name
  getSupplierName(supplierId: any): string {
    return supplierId ? supplierId.supplierName : 'No Supplier';
  }

  // Search functionality
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    console.log('🔍 Search input changed:', this.searchQuery);
    // Trigger search with debounce
    this.debouncedSearch();
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      console.log('🔍 Enter key pressed, searching for:', this.searchQuery);
      this.onSearch();
    }
  }

  onSearch(): void {
    console.log('🔍 onSearch() called with query:', this.searchQuery);
    this.currentPage = 1; // Reset to first page when searching
    this.isSearching = true;
    this.errorMessage = '';
    
    // Reload items for all expanded categories
    this.expandedCategories.forEach(categoryId => {
      const categoryRow = this.categoryRows.find(r => r.id === categoryId);
      if (categoryRow) {
        const categoryData = this.categoryItemsMap.get(categoryId);
        if (categoryData) {
          categoryData.currentPage = 1; // Reset to first page
        }
        this.loadCategoryItems(categoryRow, true); // Force reload with new search
      }
    });
    
    this.cdr.markForCheck(); // Trigger change detection for loading state
  }

  onCategoryChange(): void {
    console.log('🔍 Category changed to:', this.selectedCategoryId);
    // Ensure we have a valid categoryId (handle null/undefined from clearing)
    if (!this.selectedCategoryId || this.selectedCategoryId === null) {
      this.selectedCategoryId = 'all';
    }
    this.currentPage = 1; // Reset to first page when category changes
    this.errorMessage = '';
    this.cdr.markForCheck(); // Trigger change detection for OnPush
    this.loadItems();
  }

  private debouncedSearch(): void {
    // Clear any existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Set a new timeout for debounced search
    this.searchTimeout = setTimeout(() => {
      console.log('🔍 Debounced search triggered for:', this.searchQuery);
      this.onSearch();
    }, 300); // 300ms debounce
  }

  clearSearch(): void {
    console.log('🔍 Clearing search');
    this.searchQuery = '';
    this.selectedCategoryId = 'all';
    this.currentPage = 1;
    this.isSearching = false;
    this.errorMessage = '';
    this.cdr.markForCheck();
    this.loadItems();
  }

  getCategoryName(categoryId: any): string {
    if (!categoryId) return '—';
    if (typeof categoryId === 'object' && categoryId.categoryName) {
      return categoryId.categoryName;
    }
    return '—';
  }


  // TrackBy function for better performance
  trackByItemId: TrackByFunction<Item> = (index: number, item: Item): string => {
    return item._id;
  };

  // TrackBy function for pagination
  trackByPageNumber: TrackByFunction<number> = (index: number, page: number): number => {
    return page;
  };

  // Image handling methods
  getItemImage(item: Item): string {
    // If the image has failed to load before, return placeholder
    if (this.imageErrors.has(item._id)) {
      return this.NO_IMAGE_PLACEHOLDER;
    }
    
    // If no image URL provided, return placeholder
    if (!item.itemImage || item.itemImage.trim() === '') {
      return this.NO_IMAGE_PLACEHOLDER;
    }
    
    return item.itemImage;
  }

  onImageError(item: Item): void {
    console.log('🖼️ Image failed to load for item:', item.itemName, 'URL:', item.itemImage);
    this.imageErrors.add(item._id);
    this.cdr.markForCheck(); // Trigger change detection to update the image
  }

  onImageLoad(item: Item): void {
    // Remove from error set if it loads successfully
    this.imageErrors.delete(item._id);
  }

  // Check if an image should show placeholder
  shouldShowPlaceholder(item: Item): boolean {
    return !item.itemImage || 
           item.itemImage.trim() === '' || 
           this.imageErrors.has(item._id);
  }

  // Stock management methods
  openStockManagementModal(): void {
    this.showStockModal = true;
    this.resetStockForm();
  }

  closeStockModal(): void {
    this.showStockModal = false;
    this.resetStockForm();
  }

  resetStockForm(): void {
    this.selectedStockItem = '';
    this.selectedStockCategoryId = 'all';
    this.availableStock = 0;
    this.stockQuantity = 0;
    this.unitCost = 0;
    this.sellingCost = 0;
    this.stockNotes = '';
    this.filterStockItems();
  }
  
  onStockCategoryChange(): void {
    // Filter stock items based on selected category
    this.filterStockItems();
    // Clear selected item if it's no longer in filtered list
    if (this.selectedStockItem && !this.filteredStockItems.find(item => item._id === this.selectedStockItem)) {
      this.selectedStockItem = '';
      this.onStockItemChange();
    }
    this.cdr.markForCheck();
  }
  
  filterStockItems(): void {
    if (!this.selectedStockCategoryId || this.selectedStockCategoryId === 'all' || this.selectedStockCategoryId === null) {
      // Show all items
      this.filteredStockItems = [...this.allStockItems];
    } else {
      // Filter by category
      this.filteredStockItems = this.allStockItems.filter(item => {
        if (!item.categoryId) {
          // Non-categorized items - show only if "non-categorized" is selected
          return this.selectedStockCategoryId === 'non-categorized';
        }
        // Check if item's category matches selected category
        const categoryId = typeof item.categoryId === 'string' ? item.categoryId : item.categoryId._id;
        return categoryId === this.selectedStockCategoryId;
      });
    }
  }

  onStockItemChange(): void {
    if (this.selectedStockItem) {
      // Search in both items and filteredStockItems
      const item = this.filteredStockItems.find(i => i._id === this.selectedStockItem) || 
                   this.allStockItems.find(i => i._id === this.selectedStockItem);
      if (item) {
        // Use availableQty as the current available stock
        this.availableStock = item.availableQty || 0;
        // Pre-fill unit cost and selling cost from item data if available
        // Note: These properties might not exist in the Item interface, so we'll set defaults
        this.unitCost = 0;
        this.sellingCost = item.sellingCost || 0;
      }
    } else {
      this.availableStock = 0;
      this.unitCost = 0;
      this.sellingCost = 0;
    }
  }


  addStock(): void {
    if (!this.selectedStockItem || !this.stockQuantity || (!this.isUser2 ? !this.unitCost : false) || (this.isSuperAdmin && !this.sellingCost)) {
      return;
    }

    const item = this.items.find(i => i._id === this.selectedStockItem);
    if (!item) {
      this.errorMessage = 'Selected item not found.';
      return;
    }

    // Prepare the API payload
    const stockPayload: StockAdditionRequest = {
      quantity: this.stockQuantity,
      unitCost: this.isUser2 ? 0 : this.unitCost, // Set unitCost to 0 for user2
      sellingCost: this.isSuperAdmin ? this.sellingCost : undefined,
      notes: this.stockNotes || ''
    };

    // Show confirmation
    const totalCost = this.isUser2 ? 0 : this.stockQuantity * this.unitCost;
    const newAvailableStock = this.availableStock + this.stockQuantity;
let message = `Add ${this.stockQuantity} units of "${item.itemName}"?\n\n`;
    if (!this.isUser2) {
      message += `Unit Cost: AED ${this.unitCost.toFixed(2)}\n` +
                `Total Cost: AED ${totalCost.toFixed(2)}\n`;
    }
    message += `New Available Stock: ${newAvailableStock} units`;
    if (this.isSuperAdmin) {
      message += `\nSelling Cost: AED ${this.sellingCost.toFixed(2)}`;
    }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirm Stock Addition',
        message:
          message,
        confirmText: 'Add Stock',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed) => {
      if (!confirmed) return;
      this.isLoading = true;
      this.errorMessage = '';

      console.log('Adding stock with payload:', stockPayload);

      // Call the real API
      this.itemService.addStock(this.selectedStockItem, stockPayload).pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      ).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Stock added successfully:', response);
            this.toastService.success('Stock added successfully!');
            this.closeStockModal();
            // Refresh all expanded categories
            this.expandedCategories.forEach(categoryId => {
              const categoryRow = this.categoryRows.find(r => r.id === categoryId);
              if (categoryRow) {
                this.loadCategoryItems(categoryRow, true); // Force reload
              }
            });
            this.cdr.markForCheck();
          } else {
            this.errorMessage = 'Failed to add stock. Please try again.';
          }
        },
        error: (error) => {
          console.error('Error adding stock:', error);
          this.handleAddStockError(error);
        }
      });
    });
  }

  private handleAddStockError(error: any): void {
    if (error.status === 401) {
      this.router.navigate(['/login']);
    } else if (error.status === 403) {
      this.errorMessage = 'You do not have permission to add stock.';
    } else if (error.status === 404) {
      this.errorMessage = 'Item not found. It may have been deleted.';
    } else if (error.status >= 500) {
      this.errorMessage = 'Server error. Please try again later.';
    } else {
      this.errorMessage = error.message || 'Failed to add stock. Please try again.';
    }
  }

  // Ng Select handles searching; update selection change handler

  getSelectedItemName(): string {
    if (this.selectedStockItem) {
      const selectedItem = this.allStockItems.find(item => item._id === this.selectedStockItem);
      return selectedItem ? selectedItem.itemName : '';
    }
    return '';
  }

}
