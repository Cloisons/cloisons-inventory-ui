import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ItemService, Item, StockHistoryItem, StockHistoryResponse } from '../../core/services/item.service';
import { AuthService } from '../../core/services/auth.service';
import { UpdateSellingCostModalComponent } from '../../shared/components/update-selling-cost-modal/update-selling-cost-modal.component';

@Component({
  selector: 'app-view-item',
  standalone: true,
  imports: [CommonModule, RouterModule, UpdateSellingCostModalComponent],
  templateUrl: './view-item.component.html',
  styleUrls: ['./view-item.component.scss']
})
export class ViewItemComponent implements OnDestroy {
  itemId!: string;
  item!: Item;
  stockHistory: StockHistoryItem[] = [];
  stockMeta: { page: number; limit: number; total: number; totalPages: number } | null = null;
  loadingHistory = false;
  Math = Math; // expose for template usage (e.g., Math.min)
  private destroy$ = new Subject<void>();
  isSuperAdmin = false;
  isUser2 = false;
  
  // Modal state
  showUpdateModal = false;
  selectedStockItem: StockHistoryItem | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itemService: ItemService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {
    this.isSuperAdmin = this.authService.hasRole('superAdmin');
    this.isUser2 = this.authService.hasRole('user2');
    this.itemId = this.route.snapshot.paramMap.get('id') || '';
    this.loadItem();
    if (this.isSuperAdmin) {
      this.loadStockHistory();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadItem(): void {
    if (!this.itemId) {
      this.router.navigate(['/items']);
      return;
    }
    this.itemService.getItemById(this.itemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const payload: any = res as any;
          // Support responses shaped by interceptor or raw
          this.item = (payload?.data as Item) || (payload?.item as Item) || (payload as Item);
          this.cdr.markForCheck();
        },
        error: () => this.router.navigate(['/items'])
      });
  }

  loadStockHistory(page: number = 1): void {
    if (!this.itemId) return;
    this.loadingHistory = true;
    this.itemService.getStockHistory(this.itemId, { page, limit: 10 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: StockHistoryResponse) => {
          this.stockHistory = res.data.items || [];
          this.stockMeta = res.meta;
          this.loadingHistory = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.stockHistory = [];
          this.loadingHistory = false;
          this.cdr.markForCheck();
        }
      });
  }

  getSupplierName(item: Item): string {
    const supplier: any = (item as any).supplierId;
    return supplier && supplier.supplierName ? supplier.supplierName : '—';
  }

  openUpdateModal(stockItem: StockHistoryItem): void {
    this.selectedStockItem = stockItem;
    this.showUpdateModal = true;
  }

  closeUpdateModal(): void {
    this.showUpdateModal = false;
    this.selectedStockItem = null;
  }

  onSellingCostUpdated(updatedItem: StockHistoryItem): void {
    // Update the stock history array with the updated item
    const index = this.stockHistory.findIndex(item => item._id === updatedItem._id);
    if (index !== -1) {
      this.stockHistory[index] = updatedItem;
      this.cdr.markForCheck();
    }
  }
}


