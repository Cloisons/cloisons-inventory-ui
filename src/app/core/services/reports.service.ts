import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReportData {
  id: string;
  title: string;
  data: any;
  generatedAt: string;
  parameters?: any;
}

export interface TimeTrackingReport {
  projectId: string;
  projectName: string;
  issues: Array<{
    issueId: string;
    title: string;
    originalEstimate: number;
    currentEstimate: number;
    timeSpent: number;
    status: string;
  }>;
}

export interface UserWorkloadReport {
  userId: string;
  userName: string;
  totalEstimatedHours: number;
  issues: Array<{
    issueId: string;
    title: string;
    estimatedHours: number;
    projectName: string;
    priority: string;
  }>;
}

export interface InventorySummaryReport {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  categories: Array<{
    name: string;
    count: number;
    value: number;
  }>;
  recentActivity: Array<{
    itemName: string;
    action: string;
    quantity: number;
    timestamp: string;
  }>;
}

export interface ProjectAnalyticsReport {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  averageProjectDuration: number;
  topUsedItems: Array<{
    itemName: string;
    totalQuantity: number;
    projectsUsed: number;
  }>;
}

export interface SupplierPerformanceReport {
  suppliers: Array<{
    supplierId: string;
    supplierName: string;
    totalOrders: number;
    averageDeliveryTime: number;
    onTimeDeliveryRate: number;
    averageCost: number;
    rating: number;
  }>;
}

export interface CostAnalysisReport {
  totalCosts: number;
  totalRevenue: number;
  profitMargin: number;
  costBreakdown: {
    materials: number;
    labor: number;
    overhead: number;
    other: number;
  };
  projectCosts: Array<{
    projectId: string;
    projectName: string;
    totalCost: number;
    revenue: number;
    profit: number;
  }>;
}

export interface ItemLevelReport {
  items: Array<{
    itemId: string;
    itemName: string;
    itemCode: string;
    listedItem: boolean;
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
  }>;
  analytics: {
    totalItems: number;
    inStockItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    overstockedItems: number;
    totalValue: number;
    averageTurnoverRate: number;
    listedUnlistedBreakdown: Array<{
      type: string;
      count: number;
      value: number;
      percentage: number;
    }>;
  };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectLevelReport {
  projects: Array<{
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
  }>;
  analytics: {
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
  };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  // Time Tracking Reports
  generateTimeTrackingReport(projectId: string): Observable<TimeTrackingReport> {
    return this.http.get<TimeTrackingReport>(`${this.apiUrl}/projects/${projectId}/time-tracking`);
  }

  // User Workload Reports
  generateUserWorkloadReport(userId?: string): Observable<UserWorkloadReport[]> {
    const url = userId ? `${this.apiUrl}/users/${userId}/workload` : `${this.apiUrl}/users/workload`;
    return this.http.get<UserWorkloadReport[]>(url);
  }

  // Version Workload Reports
  generateVersionWorkloadReport(versionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/versions/${versionId}/workload`);
  }

  // Inventory Summary Reports
  generateInventorySummaryReport(): Observable<InventorySummaryReport> {
    return this.http.get<InventorySummaryReport>(`${this.apiUrl}/inventory/summary`);
  }

  // Project Analytics Reports
  generateProjectAnalyticsReport(dateRange?: { start: string; end: string }): Observable<ProjectAnalyticsReport> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('start', dateRange.start).set('end', dateRange.end);
    }
    return this.http.get<ProjectAnalyticsReport>(`${this.apiUrl}/projects/analytics`, { params });
  }

  // Supplier Performance Reports
  generateSupplierPerformanceReport(): Observable<SupplierPerformanceReport> {
    return this.http.get<SupplierPerformanceReport>(`${this.apiUrl}/suppliers/performance`);
  }

  // Cost Analysis Reports
  generateCostAnalysisReport(dateRange?: { start: string; end: string }): Observable<CostAnalysisReport> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('start', dateRange.start).set('end', dateRange.end);
    }
    return this.http.get<CostAnalysisReport>(`${this.apiUrl}/costs/analysis`, { params });
  }

  // Generic report generation
  generateReport(reportType: string, parameters?: any): Observable<ReportData> {
    return this.http.post<ReportData>(`${this.apiUrl}/generate`, {
      reportType,
      parameters
    });
  }

  // Get available report types
  getAvailableReports(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/types`);
  }

  // Download report as file
  downloadReport(reportId: string, format: 'pdf' | 'excel' | 'csv' = 'pdf'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    return this.http.get(`${this.apiUrl}/${reportId}/download`, {
      params,
      responseType: 'blob'
    });
  }

  // Item Level Report
  generateItemLevelReport(filters?: any): Observable<ItemLevelReport> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.listedStatus) params = params.set('listedStatus', filters.listedStatus);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<ItemLevelReport>(`${this.apiUrl}/items/level`, { params });
  }

  // Project Level Report
  generateProjectLevelReport(filters?: any): Observable<ProjectLevelReport> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<ProjectLevelReport>(`${this.apiUrl}/projects/level`, { params });
  }
}
