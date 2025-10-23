import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, TrackByFunction, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { finalize, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ItemService, Item, StockAdditionRequest } from '../core/services/item.service';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';
// Removed Material autocomplete in favor of Ng Select
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../shared/components/confirm-dialog/confirm-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatInputComponent } from '../shared/components/mat-input/mat-input.component';


@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, MatFormFieldModule, MatInputModule, MatDialogModule, MatInputComponent],
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
  errorMessage: string = '';
  isSuperAdmin = false;
  isUser2 = false;
  
  // Stock management properties
  showStockModal: boolean = false;
  selectedStockItem: string = '';
  availableStock: number = 0;
  stockQuantity: number = 0;
  unitCost: number = 0;
  sellingCost: number = 0;
  stockNotes: string = '';
  
  // Stock item select properties (Ng Select)
  allStockItems: Item[] = [];
  
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
    
    // Load items
    this.loadItems();
    this.loadAllItems();
    
    // Using Ng Select built-in search; no manual filter init needed
  }

  loadAllItems(): void {
    this.itemService.getItems({
      page: 1,
      limit: 1000,
      search: ''
    }).subscribe((response) => {
      this.allStockItems = response.data.items || [];
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
      search: this.searchQuery
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
            this.loadItems(); // Reload the list
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
    this.cdr.markForCheck(); // Trigger change detection for loading state
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
    this.currentPage = 1;
    this.isSearching = false;
    this.errorMessage = '';
    this.cdr.markForCheck();
    this.loadItems();
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
    this.availableStock = 0;
    this.stockQuantity = 0;
    this.unitCost = 0;
    this.sellingCost = 0;
    this.stockNotes = '';
  }

  onStockItemChange(): void {
    if (this.selectedStockItem) {
      const item = this.items.find(i => i._id === this.selectedStockItem);
      if (item) {
        debugger
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
            // Reload items to reflect the changes
            this.loadItems();
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
