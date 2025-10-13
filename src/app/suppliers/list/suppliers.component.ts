import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupplierService, Supplier } from '../../core/services/supplier.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuppliersComponent {
  suppliers: Supplier[] = [];
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;
  pageRange: number[] = [];
  query = '';
  isLoading = false;
  isSearching = false;
  errorMessage = '';

  constructor(private supplierService: SupplierService, private cdr: ChangeDetectorRef) {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.supplierService.listSuppliersPaged(this.page, this.limit, this.query).subscribe({
      next: (resp) => {
        this.suppliers = resp.items;
        this.totalPages = Math.max((resp as any).meta?.totalPages || 1, 1);
        this.total = (resp as any).meta?.total || this.suppliers.length;
        this.pageRange = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.suppliers = [];
        this.errorMessage = err?.message || 'Failed to load suppliers';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearchInput(_: Event): void {
    this.page = 1;
    this.load();
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.page = 1;
      this.load();
    }
  }

  clearSearch(): void {
    this.query = '';
    this.page = 1;
    this.load();
  }

  goTo(target: number): void {
    if (target < 1 || target > this.totalPages) return;
    this.page = target;
    this.load();
  }

  onDelete(s: Supplier): void {
    if (!confirm(`Delete supplier "${s.supplierName}"?`)) return;
    this.supplierService.deleteSupplier(s._id).subscribe({
      next: () => this.load(),
    });
  }

  trackById(_: number, s: Supplier): string { return s._id; }
  trackByPageNumber(_: number, p: number): number { return p; }
  getMin(a: number, b: number): number { return a < b ? a : b; }
}



