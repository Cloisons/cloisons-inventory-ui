import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContractorService, Contractor } from '../../core/services/contractor.service';

@Component({
  selector: 'app-contractors',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './contractors.component.html',
  styleUrls: ['./contractors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractorsComponent {
  contractors: Contractor[] = [];
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;
  pageRange: number[] = [];
  query = '';
  isLoading = false;
  isSearching = false;
  errorMessage = '';

  constructor(private contractorService: ContractorService, private cdr: ChangeDetectorRef) {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.contractorService.listContractorsPaged(this.page, this.limit, this.query).subscribe({
      next: (resp) => {
        this.contractors = resp.items;
        this.totalPages = Math.max((resp as any).meta?.totalPages || 1, 1);
        this.total = (resp as any).meta?.total || this.contractors.length;
        this.pageRange = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.contractors = [];
        this.errorMessage = err?.message || 'Failed to load contractors';
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

  onDelete(c: Contractor): void {
    if (!confirm(`Delete contractor "${c.contractorName}"?`)) return;
    this.contractorService.deleteContractor(c._id).subscribe({
      next: () => this.load(),
    });
  }

  trackById(_: number, c: Contractor): string { return c._id; }
  trackByPageNumber(_: number, p: number): number { return p; }
  getMin(a: number, b: number): number { return a < b ? a : b; }
}


