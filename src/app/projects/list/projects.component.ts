import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService, Project, ProjectReturnEligibility } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { ProjectUiService, ProjectWithReturnInfo } from '../../core/services/project-ui.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectsComponent {
  projects: ProjectWithReturnInfo[] = [];
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
    private projectUiService: ProjectUiService,
    private cdr: ChangeDetectorRef
  ) {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.projectService.listProjectsPaged(this.page, this.limit, this.query).subscribe({
      next: (resp) => {
        // Enhance projects with return button information
        this.projectUiService.enhanceProjectsWithReturnInfo(resp.items).subscribe({
          next: (enhancedProjects) => {
            this.projects = enhancedProjects;
            this.totalPages = Math.max((resp as any).meta?.totalPages || 1, 1);
            this.total = (resp as any).meta?.total || this.projects.length;
            this.pageRange = Array.from({ length: this.totalPages }, (_, i) => i + 1);
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error enhancing projects with return info:', err);
            // Fallback to original projects if enhancement fails
            this.projects = resp.items.map(p => ({
              ...p,
              showReturnButton: p.returnEligibility?.isEligible || false
            } as ProjectWithReturnInfo));
            this.totalPages = Math.max((resp as any).meta?.totalPages || 1, 1);
            this.total = (resp as any).meta?.total || this.projects.length;
            this.pageRange = Array.from({ length: this.totalPages }, (_, i) => i + 1);
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        });
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

  onDelete(p: ProjectWithReturnInfo): void {
    if (!confirm(`Delete project "${p.projectName}"?`)) return;
    this.projectService.deleteProject(p._id).subscribe({
      next: () => this.load(),
    });
  }

  onReturnClick(projectId: string): void {
    // Navigate to return page
    window.location.href = `/projects/return/${projectId}`;
  }

  // Return button helper methods
  canReturn(project: ProjectWithReturnInfo): boolean {
    return project.returnEligibility?.isEligible === true && !!project._id;
  }

  getReturnButtonText(project: ProjectWithReturnInfo): string {
    if (!project.returnEligibility) {
      return 'Loading...';
    }

    if (!project.returnEligibility.isEligible) {
      if (project.returnEligibility.submissionCount >= project.returnEligibility.maxSubmissions) {
        return 'Max Returns';
      }
      if (project.returnEligibility.reason?.includes('30 days')) {
        return 'Expired';
      }
      return 'Not Eligible';
    }

    return 'Return Items';
  }

  getReturnButtonClasses(project: ProjectWithReturnInfo): string {
    const baseClasses = 'btn btn-sm';
    
    if (!this.canReturn(project)) {
      return `${baseClasses} btn-outline-secondary disabled`;
    }

    return `${baseClasses} btn-warning`;
  }

  getReturnTooltipText(project: ProjectWithReturnInfo): string {
    if (!project.returnEligibility) {
      return 'Checking eligibility...';
    }

    if (project.returnEligibility.isEligible) {
      const daysRemaining = project.returnEligibility.daysRemaining;
      const submissionsLeft = project.returnEligibility.maxSubmissions - project.returnEligibility.submissionCount;
      
      let tooltip = `Return items (${submissionsLeft} submissions left)`;
      if (daysRemaining !== undefined) {
        tooltip += ` - ${daysRemaining} days remaining`;
      }
      return tooltip;
    }

    return project.returnEligibility.reason || 'Not eligible for returns';
  }

  trackById(_: number, p: ProjectWithReturnInfo): string { return p._id; }
  trackByPageNumber(_: number, n: number): number { return n; }

  getContractorName(contractor: any): string {
    if (!contractor) return '';
    // Handle populated contractor object
    if (typeof contractor === 'object' && contractor.contractorName) {
      return contractor.contractorName;
    }
    // Fallback for string or other types
    return String(contractor);
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


