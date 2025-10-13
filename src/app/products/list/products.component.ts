import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../core/services/product.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsComponent {
  products: Product[] = [];
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;
  pageRange: number[] = [];
  query = '';
  isLoading = false;
  isSearching = false;
  errorMessage = '';

  constructor(private productService: ProductService, private cdr: ChangeDetectorRef) {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.productService.listProductsPaged(this.page, this.limit, this.query).subscribe({
      next: (resp) => {
        this.products = resp.items;
        this.totalPages = Math.max((resp as any).meta?.totalPages || 1, 1);
        this.total = (resp as any).meta?.total || this.products.length;
        this.pageRange = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.products = [];
        this.errorMessage = err?.message || 'Failed to load products';
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

  onDelete(p: Product): void {
    if (!confirm(`Delete product "${p.productName}"?`)) return;
    this.productService.deleteProduct(p._id).subscribe({ next: () => this.load() });
  }

  trackById(_: number, p: Product): string { return p._id; }
  trackByPageNumber(_: number, n: number): number { return n; }
  getMin(a: number, b: number): number { return a < b ? a : b; }
}


