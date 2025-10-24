import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReportsService } from '../../core/services/reports.service';
import { ToastService } from '../../core/services/toast.service';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface ProjectLevelData {
  projectId: string;
  projectName: string;
  projectCode: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold' | 'cancelled';
  startDate: string;
  endDate: string;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  profitMargin: number;
  contractor: string;
  contractorId: string;
  totalItems: number;
  itemsUsed: number;
  completionPercentage: number;
  daysRemaining: number;
  lastUpdated: string;
  projectDescription: string;
}

export interface ProjectAnalytics {
  totalProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  averageProfitMargin: number;
  averageCompletionRate: number;
  statusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

@Component({
  selector: 'app-project-level-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './project-level-report.component.html',
  styleUrl: './project-level-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectLevelReportComponent implements OnInit {
  projects: ProjectLevelData[] = [];
  analytics: ProjectAnalytics | null = null;
  filteredProjects: ProjectLevelData[] = [];
  loading = false;
  searchTerm = '';
  selectedStatus = '';
  sortBy = 'projectName';
  sortOrder: 'asc' | 'desc' = 'asc';
  
  // Date filter properties
  startDate: string = '';
  endDate: string = '';
  
  // Chart data
  statusChartData: any[] = [];
  profitChartData: any[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 100;
  totalPages = 0;

  // Math reference for template
  Math = Math;

  constructor(
    private reportsService: ReportsService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeDateRange();
    this.loadProjectLevelReport();
  }

  private initializeDateRange(): void {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = oneMonthAgo.toISOString().split('T')[0];
  }

  loadProjectLevelReport(): void {
    this.loading = true;
    this.cdr.markForCheck();

    const filters = {
      search: this.searchTerm,
      status: this.selectedStatus,
      startDate: this.startDate,
      endDate: this.endDate,
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    this.reportsService.generateProjectLevelReport(filters)
      .pipe(
        timeout(10000), // 10 second timeout
        catchError(error => {
          console.error('API call failed or timed out:', error);
          this.toastService.show('Failed to load project level report. Please try again.', 'error');
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.projects = response.projects || [];
            this.analytics = response.analytics;
            this.totalPages = response.meta?.totalPages || 1;
            this.applyFilters();
            this.generateChartData();
          } else {
            this.projects = [];
            this.analytics = null;
            this.totalPages = 0;
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading report:', error);
          this.toastService.show('Failed to load project level report. Please try again.', 'error');
          this.projects = [];
          this.analytics = null;
          this.totalPages = 0;
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private generateChartData(): void {
    if (!this.analytics) return;

    // Status chart data - map database statuses to frontend statuses
    this.statusChartData = this.analytics.statusBreakdown.map(item => {
      const statusMap: { [key: string]: string } = {
        'planning': 'planning',
        'completed': 'completed',
        'on-hold': 'on-hold'
      };
      const mappedStatus = statusMap[item.status] || item.status;
      return {
        name: mappedStatus,
        value: item.count,
        color: this.getStatusColor(mappedStatus)
      };
    });


    // If no status data, create sample data for testing
    if (this.statusChartData.length === 0 || this.statusChartData.every(item => item.value === 0)) {
      this.statusChartData = [
        { name: 'planning', value: 0, color: this.getStatusColor('planning') },
        { name: 'completed', value: 0, color: this.getStatusColor('completed') },
        { name: 'on-hold', value: 0, color: this.getStatusColor('on-hold') }
      ];
    }

    // Profit chart data (top 10 projects by profit)
    this.profitChartData = this.filteredProjects
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)
      .map(project => ({
        name: project.projectName,
        value: project.profit
      }));
  }

  private getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'planning': '#6c757d',
      'completed': '#28a745',
      'on-hold': '#ffc107'
    };
    return colors[status] || '#6c757d';
  }

  private getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      'low': '#28a745',
      'medium': '#ffc107',
      'high': '#fd7e14',
      'urgent': '#dc3545'
    };
    return colors[priority] || '#6c757d';
  }

  onDateChange(): void {
    this.currentPage = 1;
    this.loadProjectLevelReport();
  }

  applyFilters(): void {
    // Since we're getting filtered data from the API, we just need to apply local sorting
    let filtered = [...this.projects];

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[this.sortBy as keyof ProjectLevelData];
      const bValue = b[this.sortBy as keyof ProjectLevelData];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return this.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return this.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    this.filteredProjects = filtered;
    this.cdr.markForCheck();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.loadProjectLevelReport();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.loadProjectLevelReport();
  }


  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.applyFilters();
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PLANNING': 'planning',
      'COMPLETED': 'completed',
      'ON_HOLD': 'on-hold'
    };
    const mappedStatus = statusMap[status] || status.toLowerCase().replace('_', '-');
    return `status-${mappedStatus}`;
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PLANNING': 'Planning',
      'COMPLETED': 'Completed',
      'ON_HOLD': 'On Hold',
      'planning': 'Planning',
      'completed': 'Completed',
      'on-hold': 'On Hold'
    };
    return statusMap[status] || status;
  }



  getProfitChartWidth(value: number): number {
    if (this.profitChartData.length === 0) return 0;
    const maxValue = Math.max(...this.profitChartData.map(p => Math.abs(p.value)));
    return maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0;
  }

  getStatusChartWidth(value: number): number {
    if (!this.analytics || this.analytics.totalProjects === 0) return 0;
    return (value / this.analytics.totalProjects) * 100;
  }

  getPagedProjects(): ProjectLevelData[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProjects.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProjectLevelReport();
    }
  }

  exportReport(format: 'pdf' | 'excel' | 'csv'): void {
    this.toastService.show(`Exporting report as ${format.toUpperCase()}...`, 'info');
    
    switch (format) {
      case 'pdf':
        this.exportToPDF();
        break;
      case 'excel':
        this.exportToExcel();
        break;
      case 'csv':
        this.exportToCSV();
        break;
    }
  }

  private exportToPDF(): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const content = this.generatePrintContent();
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
      this.toastService.show('PDF export initiated. Please use your browser\'s print dialog.', 'success');
    } else {
      this.toastService.show('Failed to open print dialog. Please check your browser settings.', 'error');
    }
  }

  private exportToExcel(): void {
    const csvContent = this.generateCSVContent();
    this.downloadFile(csvContent, 'project-level-report.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    this.toastService.show('Excel file exported successfully!', 'success');
  }

  private exportToCSV(): void {
    const csvContent = this.generateCSVContent();
    this.downloadFile(csvContent, 'project-level-report.csv', 'text/csv');
    this.toastService.show('CSV file exported successfully!', 'success');
  }

  private generateCSVContent(): string {
    const headers = [
      'Project Name',
      'Project Code',
      'Status',
      'Start Date',
      'End Date',
      'Total Cost (AED)',
      'Total Revenue (AED)',
      'Profit (AED)',
      'Profit Margin (%)',
      'Contractor',
      'Total Items',
      'Items Used',
      'Days Remaining'
    ];

    const rows = this.projects.map(project => [
      `"${project.projectName}"`,
      `"${project.projectCode || 'N/A'}"`,
      this.getStatusText(project.status),
      new Date(project.startDate).toLocaleDateString(),
      new Date(project.endDate).toLocaleDateString(),
      project.totalCost.toFixed(2),
      project.totalRevenue.toFixed(2),
      project.profit.toFixed(2),
      project.profitMargin.toFixed(2),
      `"${project.contractor}"`,
      project.totalItems,
      project.itemsUsed,
      project.daysRemaining
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private generatePrintContent(): string {
    const analytics = this.analytics;
    const projects = this.projects;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Project Level Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .analytics { display: flex; justify-content: space-around; margin-bottom: 30px; }
          .analytics-card { text-align: center; padding: 15px; border: 1px solid #ddd; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .status-badge { padding: 4px 8px; border-radius: 4px; color: white; }
          .priority-badge { padding: 4px 8px; border-radius: 4px; color: white; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Project Level Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
        
        ${analytics ? `
        <div class="analytics">
          <div class="analytics-card">
            <h3>${analytics.totalProjects}</h3>
            <p>Total Projects</p>
          </div>
          <div class="analytics-card">
            <h3>${analytics.completedProjects}</h3>
            <p>Completed Projects</p>
          </div>
          <div class="analytics-card">
            <h3>${analytics.onHoldProjects}</h3>
            <p>On Hold Projects</p>
          </div>
          <div class="analytics-card">
            <h3>${analytics.totalCost.toFixed(2)} AED</h3>
            <p>Total Cost</p>
          </div>
          <div class="analytics-card">
            <h3>${analytics.totalProfit.toFixed(2)} AED</h3>
            <p>Total Profit</p>
          </div>
        </div>
        ` : ''}
        
        <table>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Status</th>
              <th>Total Cost (AED)</th>
              <th>Profit (AED)</th>
              <th>Contractor</th>
            </tr>
          </thead>
          <tbody>
            ${projects.map(project => `
              <tr>
                <td>${project.projectName}</td>
                <td><span class="status-badge">${this.getStatusText(project.status)}</span></td>
                <td>${project.totalCost.toFixed(2)}</td>
                <td>${project.profit.toFixed(2)}</td>
                <td>${project.contractor}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  refreshReport(): void {
    this.currentPage = 1;
    this.loadProjectLevelReport();
  }
}
