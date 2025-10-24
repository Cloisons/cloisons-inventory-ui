import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReportCardComponent } from './report-card/report-card.component';
import { ReportsService } from '../core/services/reports.service';
import { ToastService } from '../core/services/toast.service';

export interface Report {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'forecast' | 'other';
  route?: string;
  action?: () => void;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReportCardComponent, RouterModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit {
  forecastReports: Report[] = [
    {
      id: 'item-level',
      title: 'Item Level Report',
      description: 'Detailed analysis of individual items including stock levels, usage patterns, cost trends, and performance metrics.',
      icon: 'mdi-package-variant',
      category: 'forecast',
      action: () => this.generateItemLevelReport()
    },
    {
      id: 'project-level',
      title: 'Project Level Report',
      description: 'Comprehensive project analytics including progress tracking, resource utilization, cost analysis, and timeline performance.',
      icon: 'mdi-folder-chart',
      category: 'forecast',
      action: () => this.generateProjectLevelReport()
    },
    {
      id: 'supplier-level',
      title: 'Supplier Level Report',
      description: 'Supplier performance analysis including delivery times, quality metrics, cost effectiveness, and reliability scores.',
      icon: 'mdi-truck-delivery',
      category: 'forecast',
      action: () => this.generateSupplierLevelReport()
    }
  ];

  otherReports: Report[] = [
    {
      id: 'contractor-level',
      title: 'Contractor Level Report',
      description: 'Contractor performance evaluation including project completion rates, quality scores, and resource efficiency.',
      icon: 'mdi-account-group',
      category: 'other',
      action: () => this.generateContractorLevelReport()
    },
    {
      id: 'product-level',
      title: 'Product Level Report',
      description: 'Product performance analysis including sales trends, inventory turnover, profitability, and market demand.',
      icon: 'mdi-chart-box',
      category: 'other',
      action: () => this.generateProductLevelReport()
    }
  ];

  constructor(
    private router: Router,
    private reportsService: ReportsService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initialize any required data
  }

  onReportClick(report: Report): void {
    if (report.action) {
      report.action();
    } else if (report.route) {
      this.router.navigate([report.route]);
    }
  }

  private generateItemLevelReport(): void {
    this.toastService.show('Opening Item Level Report...', 'info');
    this.router.navigate(['/reports/item-level']);
  }

  private generateProjectLevelReport(): void {
    this.toastService.show('Opening Project Level Report...', 'info');
    this.router.navigate(['/reports/project-level']);
  }

  private generateSupplierLevelReport(): void {
    this.toastService.show('Opening Supplier Level Report...', 'info');
    this.router.navigate(['/reports/supplier-level']);
  }

  private generateContractorLevelReport(): void {
    this.toastService.show('Generating Contractor Level Report...', 'info');
    // For now, show a placeholder - in a real implementation, this would:
    // 1. Call the API for contractor data
    // 2. Display results or download file
    setTimeout(() => {
      this.toastService.show('Contractor Level Report generated successfully!', 'success');
    }, 2000);
  }

  private generateProductLevelReport(): void {
    this.toastService.show('Generating Product Level Report...', 'info');
    // For now, show a placeholder - in a real implementation, this would:
    // 1. Call the API for product data
    // 2. Display results or download file
    setTimeout(() => {
      this.toastService.show('Product Level Report generated successfully!', 'success');
    }, 2000);
  }
}
