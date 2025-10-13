import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService, Project } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectsComponent {
  projects: Project[] = [];
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
    private projectService: ProjectService, 
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.projectService.listProjectsPaged(this.page, this.limit, this.query).subscribe({
      next: (resp) => {
        this.projects = resp.items;
        this.totalPages = Math.max((resp as any).meta?.totalPages || 1, 1);
        this.total = (resp as any).meta?.total || this.projects.length;
        this.pageRange = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.projects = [];
        this.errorMessage = err?.message || 'Failed to load projects';
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

  onDelete(p: Project): void {
    if (!confirm(`Delete project "${p.projectName}"?`)) return;
    this.projectService.deleteProject(p._id).subscribe({
      next: () => this.load(),
    });
  }

  trackById(_: number, p: Project): string { return p._id; }
  trackByPageNumber(_: number, n: number): number { return n; }

  getContractorName(contractor: Project['contractorId']): string {
    if (!contractor) return '';
    if (typeof contractor === 'string') return contractor;
    return contractor.contractorName;
  }

  getMin(a: number, b: number): number { return a < b ? a : b; }

  isSuperAdmin(): boolean {
    return this.authService.hasRole('superAdmin');
  }

  isUser2(): boolean {
    return this.authService.hasRole('user2');
  }

  getEmptyStateColspan(): number {
    let colspan = 5; // Base columns: Project name, Contractor, Status, Created, Action
    if (this.isSuperAdmin()) {
      colspan += 1; // Add Total Unit Cost column
    }
    if (!this.isUser2()) {
      colspan += 1; // Add Total Selling column
    }
    return colspan;
  }
}


