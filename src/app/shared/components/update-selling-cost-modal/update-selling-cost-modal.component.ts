import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemService, StockHistoryItem } from '../../../core/services/item.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-update-selling-cost-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './update-selling-cost-modal.component.html',
  styleUrls: ['./update-selling-cost-modal.component.scss']
})
export class UpdateSellingCostModalComponent implements OnInit, OnChanges {
  @Input() stockHistoryItem: StockHistoryItem | null = null;
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<StockHistoryItem>();

  sellingCost: number = 0;
  reason: string = '';
  isUpdating: boolean = false;
  errorMessage: string = '';

  constructor(
    private itemService: ItemService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    if (this.stockHistoryItem) {
      this.sellingCost = this.stockHistoryItem.sellingCost || 0;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stockHistoryItem'] && this.stockHistoryItem) {
      this.sellingCost = this.stockHistoryItem.sellingCost || 0;
    }
    this.errorMessage = '';
  }

  onClose(): void {
    this.close.emit();
    this.resetForm();
  }

  onUpdate(): void {
    if (!this.stockHistoryItem) return;

    this.errorMessage = '';
    
    if (this.sellingCost < 0) {
      this.errorMessage = 'Selling cost must be a non-negative number';
      return;
    }

    this.isUpdating = true;

    this.itemService.updateSellingCost(
      this.stockHistoryItem._id,
      this.sellingCost,
      undefined
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Selling cost updated successfully!');
          // Update the local stock history item with new values
          const updatedItem: StockHistoryItem = {
            ...this.stockHistoryItem!,
            sellingCost: this.sellingCost,
            reason: this.stockHistoryItem!.reason
          };
          this.updated.emit(updatedItem);
          this.onClose();
        }
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to update selling cost';
        this.isUpdating = false;
      }
    });
  }

  private resetForm(): void {
    this.sellingCost = 0;
    this.errorMessage = '';
    this.isUpdating = false;
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
