import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CategoryService, Category } from '../../core/services/category.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoriesComponent {
  categories: Category[] = [];
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;
  pageRange: number[] = [];
  query = '';
  isLoading = false;
  isSearching = false;
  errorMessage = '';

  constructor(
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
  ) {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.categoryService.listCategories(this.page, this.limit, this.query).subscribe({
      next: (resp) => {
        this.categories = resp.items || [];
        this.totalPages = Math.max(resp.meta?.totalPages || 1, 1);
        this.total = resp.meta?.totalItems || this.categories.length;
        this.pageRange = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.categories = [];
        this.errorMessage = err?.message || 'Failed to load categories';
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

  onDelete(c: Category): void {
    if (!confirm(`Delete category "${c.categoryName}"?`)) return;
    this.categoryService.deleteCategory(c._id).subscribe({
      next: () => this.load(),
    });
  }

  trackById(_: number, c: Category): string {
    return c._id;
  }

  trackByPageNumber(_: number, p: number): number {
    return p;
  }

  getMin(a: number, b: number): number {
    return a < b ? a : b;
  }
}

