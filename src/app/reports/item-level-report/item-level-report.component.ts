import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReportsService } from '../../core/services/reports.service';
import { ToastService } from '../../core/services/toast.service';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface ItemLevelData {
  itemId: string;
  itemName: string;
  itemCode: string;
  listedItem: boolean; // true for listed items, false for unlisted items
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unitPrice: number;
  totalValue: number;
  lastUpdated: string;
  supplier: string;
  supplierId: string;
  unitScale: string;
  usageRate: number;
  turnoverRate: number;
  costTrend: number;
  demandForecast: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'overstocked';
  itemDescription: string;
  itemImage?: string;
}

export interface ItemAnalytics {
  totalItems: number;
  inStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockedItems: number;
  totalValue: number;
  averageTurnoverRate: number;
  listedUnlistedBreakdown: Array<{
    type: string; // 'Listed Items' or 'Unlisted Items'
    count: number;
    value: number;
    percentage: number;
  }>;
}

@Component({
  selector: 'app-item-level-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './item-level-report.component.html',
  styleUrl: './item-level-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemLevelReportComponent implements OnInit {
  items: ItemLevelData[] = [];
  analytics: ItemAnalytics | null = null;
  filteredItems: ItemLevelData[] = [];
  loading = false;
  searchTerm = '';
  selectedListedStatus = ''; // 'listed', 'unlisted', or ''
  selectedStatus = '';
  sortBy = 'itemName';
  sortOrder: 'asc' | 'desc' = 'asc';
  
  // Chart data
  listedUnlistedChartData: any[] = [];
  statusChartData: any[] = [];
  turnoverChartData: any[] = [];

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
    this.loadItemLevelReport();
  }

  loadItemLevelReport(): void {
    this.loading = true;
    this.cdr.markForCheck();

    const filters = {
      search: this.searchTerm,
      listedStatus: this.selectedListedStatus,
      status: this.selectedStatus,
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    this.reportsService.generateItemLevelReport(filters)
      .pipe(
        timeout(10000), // 10 second timeout
        catchError(error => {
          console.error('API call failed or timed out:', error);
          this.toastService.show('Failed to load item level report. Please try again.', 'error');
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.items = response.items || [];
            this.analytics = response.analytics;
            this.totalPages = response.meta?.totalPages || 1;
            this.applyFilters();
            this.generateChartData();
          } else {
            this.items = [];
            this.analytics = null;
            this.totalPages = 0;
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading report:', error);
          this.toastService.show('Failed to load item level report. Please try again.', 'error');
          this.items = [];
          this.analytics = null;
          this.totalPages = 0;
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }




  private generateChartData(): void {
    if (!this.analytics) return;

    // Listed/Unlisted chart data
    this.listedUnlistedChartData = this.analytics.listedUnlistedBreakdown.map(item => ({
      name: item.type,
      value: item.count,
      percentage: item.percentage
    }));

    // Status chart data
    this.statusChartData = [
      { name: 'In Stock', value: this.analytics.inStockItems, color: '#4caf50' },
      { name: 'Low Stock', value: this.analytics.lowStockItems, color: '#ff9800' },
      { name: 'Out of Stock', value: this.analytics.outOfStockItems, color: '#f44336' },
      { name: 'Overstocked', value: this.analytics.overstockedItems, color: '#9c27b0' }
    ];

    // Turnover chart data
    this.turnoverChartData = this.items.slice(0, 10).map(item => ({
      name: item.itemName,
      value: item.turnoverRate
    }));
  }

  applyFilters(): void {
    // Since we're getting filtered data from the API, we just need to apply local sorting
    let filtered = [...this.items];

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[this.sortBy as keyof ItemLevelData];
      const bValue = b[this.sortBy as keyof ItemLevelData];
      
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

    this.filteredItems = filtered;
    this.cdr.markForCheck();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.loadItemLevelReport();
  }

  onListedStatusChange(): void {
    this.currentPage = 1;
    this.loadItemLevelReport();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.loadItemLevelReport();
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
    switch (status) {
      case 'in-stock': return 'status-in-stock';
      case 'low-stock': return 'status-low-stock';
      case 'out-of-stock': return 'status-out-of-stock';
      case 'overstocked': return 'status-overstocked';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'in-stock': return 'In Stock';
      case 'low-stock': return 'Low Stock';
      case 'out-of-stock': return 'Out of Stock';
      case 'overstocked': return 'Overstocked';
      default: return status;
    }
  }

  getPaginatedItems(): ItemLevelData[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredItems.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadItemLevelReport();
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
    // For PDF export, we'll use the browser's print functionality
    // In a real implementation, you might want to use a library like jsPDF
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
    // Create Excel-like CSV with proper formatting
    const csvContent = this.generateCSVContent();
    this.downloadFile(csvContent, 'item-level-report.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    this.toastService.show('Excel file exported successfully!', 'success');
  }

  private exportToCSV(): void {
    const csvContent = this.generateCSVContent();
    this.downloadFile(csvContent, 'item-level-report.csv', 'text/csv');
    this.toastService.show('CSV file exported successfully!', 'success');
  }

  private generateCSVContent(): string {
    const headers = [
      'Item Name',
      'Item Code',
      'Type',
      'Current Stock',
      'Min Stock Level',
      'Max Stock Level',
      'Unit Price (AED)',
      'Total Value (AED)',
      'Supplier',
      'Usage Rate',
      'Turnover Rate',
      'Status',
      'Last Updated'
    ];

    const rows = this.items.map(item => [
      `"${item.itemName}"`,
      `"${item.itemCode || 'N/A'}"`,
      item.listedItem ? 'Listed' : 'Unlisted',
      item.currentStock,
      item.minStockLevel,
      item.maxStockLevel,
      item.unitPrice.toFixed(2),
      item.totalValue.toFixed(2),
      `"${item.supplier}"`,
      item.usageRate.toFixed(2),
      item.turnoverRate.toFixed(2),
      this.getStatusText(item.status),
      new Date(item.lastUpdated).toLocaleDateString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private generatePrintContent(): string {
    const analytics = this.analytics;
    const items = this.items;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Item Level Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .analytics { display: flex; justify-content: space-around; margin-bottom: 30px; }
          .analytics-card { text-align: center; padding: 15px; border: 1px solid #ddd; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .status-badge { padding: 4px 8px; border-radius: 4px; color: white; }
          .in-stock { background-color: #28a745; }
          .low-stock { background-color: #ffc107; color: black; }
          .out-of-stock { background-color: #dc3545; }
          .overstocked { background-color: #6f42c1; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Item Level Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
        
        ${analytics ? `
        <div class="analytics">
          <div class="analytics-card">
            <h3>${analytics.totalItems}</h3>
            <p>Total Items</p>
          </div>
          <div class="analytics-card">
            <h3>${analytics.inStockItems}</h3>
            <p>In Stock</p>
          </div>
          <div class="analytics-card">
            <h3>${analytics.lowStockItems}</h3>
            <p>Low Stock</p>
          </div>
          <div class="analytics-card">
            <h3>${analytics.outOfStockItems}</h3>
            <p>Out of Stock</p>
          </div>
          <div class="analytics-card">
            <h3>${analytics.totalValue.toFixed(2)} AED</h3>
            <p>Total Value</p>
          </div>
        </div>
        ` : ''}
        
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Type</th>
              <th>Current Stock</th>
              <th>Unit Price (AED)</th>
              <th>Total Value (AED)</th>
              <th>Supplier</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.itemName}</td>
                <td>${item.listedItem ? 'Listed' : 'Unlisted'}</td>
                <td>${item.currentStock}</td>
                <td>${item.unitPrice.toFixed(2)}</td>
                <td>${item.totalValue.toFixed(2)}</td>
                <td>${item.supplier}</td>
                <td><span class="status-badge ${item.status}">${this.getStatusText(item.status)}</span></td>
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
    this.loadItemLevelReport();
  }
}
