import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReportsService, SupplierLevelReport } from '../../core/services/reports.service';
import { ToastService } from '../../core/services/toast.service';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface SupplierLevelData {
  supplierId: string;
  supplierName: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  address: string;
  countryOfOrigin: string;
  totalItems: number;
  totalValue: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  costEffectiveness: number;
  reliabilityScore: number;
  lastOrderDate: string | null;
  totalOrders: number;
  lastUpdated: string;
  createdAt: string;
}

export interface SupplierAnalytics {
  totalSuppliers: number;
  totalItems: number;
  totalValue: number;
  averageDeliveryTime: number;
  averageQualityScore: number;
  averageReliabilityScore: number;
  countryBreakdown: Array<{
    country: string;
    count: number;
    value: number;
    percentage: number;
  }>;
  performanceBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

@Component({
  selector: 'app-supplier-level-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './supplier-level-report.component.html',
  styleUrl: './supplier-level-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupplierLevelReportComponent implements OnInit {
  reportData: SupplierLevelReport | null = null;
  loading = false;
  error: string | null = null;

  // Filter properties
  searchTerm = '';
  selectedCountry = '';
  startDate = '';
  endDate = '';
  currentPage = 1;
  itemsPerPage = 10;

  // Available countries for filter
  countries: string[] = [];

  constructor(
    private reportsService: ReportsService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    const filters = {
      search: this.searchTerm || undefined,
      countryOfOrigin: this.selectedCountry || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    this.reportsService.generateSupplierLevelReport(filters)
      .pipe(
        timeout(15000), // 15 second timeout
        catchError(error => {
          console.error('API call failed or timed out:', error);
          this.toastService.show('Failed to load supplier level report. Please try again.', 'error');
          return of(null);
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.reportData = data;
            this.extractCountries();
          } else {
            this.reportData = null;
            this.error = 'No data available';
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.error = 'Failed to load supplier level report';
          this.loading = false;
          this.toastService.show('Failed to load supplier level report', 'error');
          console.error('Error loading supplier level report:', error);
          this.cdr.markForCheck();
        }
      });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadReport();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadReport();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadReport();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadReport();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCountry = '';
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 1;
    this.loadReport();
  }



  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AED'
    }).format(value);
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }


  private extractCountries(): void {
    if (this.reportData?.analytics.countryBreakdown) {
      this.countries = this.reportData.analytics.countryBreakdown.map(c => c.country);
    }
  }

  get totalPages(): number {
    return this.reportData?.meta.totalPages || 0;
  }

  get hasData(): boolean {
    return !!(this.reportData?.suppliers && this.reportData.suppliers.length > 0);
  }

  // Make Math available in template
  Math = Math;

  refreshReport(): void {
    this.currentPage = 1;
    this.loadReport();
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
    this.downloadFile(csvContent, 'supplier-level-report.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    this.toastService.show('Excel file exported successfully!', 'success');
  }

  private exportToCSV(): void {
    const csvContent = this.generateCSVContent();
    this.downloadFile(csvContent, 'supplier-level-report.csv', 'text/csv');
    this.toastService.show('CSV file exported successfully!', 'success');
  }

  private generateCSVContent(): string {
    const headers = [
      'Supplier Name',
      'Contact Person',
      'Email',
      'Phone Number',
      'Country',
      'Total Items',
      'Total Value (AED)',
      'Average Delivery Time (days)',
      'On-Time Delivery Rate (%)',
      'Quality Score',
      'Cost Effectiveness',
      'Reliability Score',
      'Total Orders',
      'Last Order Date'
    ];

    const rows = (this.reportData?.suppliers || []).map(supplier => [
      `"${supplier.supplierName}"`,
      `"${supplier.contactPerson}"`,
      `"${supplier.email}"`,
      `"${supplier.phoneNumber}"`,
      `"${supplier.countryOfOrigin}"`,
      supplier.totalItems,
      supplier.totalValue.toFixed(2),
      supplier.averageDeliveryTime.toFixed(1),
      supplier.onTimeDeliveryRate.toFixed(1),
      supplier.qualityScore.toFixed(1),
      supplier.costEffectiveness.toFixed(1),
      supplier.reliabilityScore.toFixed(1),
      supplier.totalOrders,
      supplier.lastOrderDate ? new Date(supplier.lastOrderDate).toLocaleDateString() : 'N/A'
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private generatePrintContent(): string {
    const analytics = this.reportData?.analytics;
    const suppliers = this.reportData?.suppliers || [];
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Supplier Level Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .analytics { display: flex; justify-content: space-around; margin-bottom: 30px; }
          .analytics-card { text-align: center; padding: 15px; border: 1px solid #ddd; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .performance-badge { padding: 4px 8px; border-radius: 4px; color: white; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Supplier Level Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
        
        ${analytics ? `
        <div class="analytics">
          <div class="analytics-card">
            <h3>${analytics.totalSuppliers}</h3>
            <p>Total Suppliers</p>
          </div>
          <div class="analytics-card">
            <h3>${analytics.totalItems}</h3>
            <p>Total Items</p>
          </div>
          <div class="analytics-card">
            <h3>${analytics.totalValue.toFixed(2)} AED</h3>
            <p>Total Value</p>
          </div>
          <div class="analytics-card">
            <h3>${analytics.averageDeliveryTime.toFixed(1)} days</h3>
            <p>Avg Delivery Time</p>
          </div>
          <div class="analytics-card">
            <h3>${analytics.averageQualityScore.toFixed(1)}</h3>
            <p>Avg Quality Score</p>
          </div>
        </div>
        ` : ''}
        
        <table>
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>Country</th>
              <th>Total Items</th>
              <th>Total Value (AED)</th>
              <th>Quality Score</th>
              <th>Reliability Score</th>
              <th>Total Orders</th>
            </tr>
          </thead>
          <tbody>
            ${suppliers.map(supplier => `
              <tr>
                <td>${supplier.supplierName}</td>
                <td>${supplier.countryOfOrigin}</td>
                <td>${supplier.totalItems}</td>
                <td>${supplier.totalValue.toFixed(2)}</td>
                <td>${supplier.qualityScore.toFixed(1)}</td>
                <td>${supplier.reliabilityScore.toFixed(1)}</td>
                <td>${supplier.totalOrders}</td>
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
}
