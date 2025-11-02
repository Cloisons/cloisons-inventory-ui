import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProjectService, Project } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CategoryService, Category } from '../../core/services/category.service';
import { ItemService } from '../../core/services/item.service';

interface ProjectItemWithDetails {
  itemId: {
    _id: string;
    itemName: string;
    unitCost?: number;
    sellingCost?: number;
    unitScale: string;
    categoryId?: {
      _id: string;
      categoryName: string;
    } | null;
  };
  quantity: number;
  listedItem: boolean;
  sellingPrice?: number | null;
  unitPrice?: number | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-view-project',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './view-project.component.html',
  styleUrls: ['./view-project.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewProjectComponent implements OnInit, OnDestroy {
  project: Project | null = null;
  isLoading = false;
  errorMessage = '';
  selectedCategoryId: string | null = ''; // Initialize as empty string to match select option value
  allCategories: Category[] = [];
  isLoadingCategories = false;
  itemCategoryMap: Map<string, string> = new Map(); // itemId -> categoryId
  private destroy$ = new Subject<void>();

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private toastService: ToastService,
    private categoryService: CategoryService,
    private itemService: ItemService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProject();
  }

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoryService.listCategories(1, 100, undefined, undefined, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.allCategories = resp.items || [];
          this.isLoadingCategories = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load categories:', err);
          this.allCategories = [];
          this.isLoadingCategories = false;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProject(): void {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (!projectId) {
      this.errorMessage = 'Project ID not found';
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.projectService.getProject(projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project) => {
          this.project = project;
          this.loadItemCategories();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorMessage = err?.message || 'Failed to load project';
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadItemCategories(): void {
    if (!this.project?.itemsUsed || this.project.itemsUsed.length === 0) {
      return;
    }

    // Extract unique item IDs from project items
    const itemIds = new Set<string>();
    this.project.itemsUsed.forEach(item => {
      const itemIdObj = item.itemId as any;
      const itemId = typeof itemIdObj === 'string' ? itemIdObj : itemIdObj?._id;
      if (itemId && typeof itemId === 'string') {
        itemIds.add(itemId);
      }
    });

    if (itemIds.size === 0) {
      return;
    }

    // Fetch all items in parallel to get their categoryIds
    const itemObservables = Array.from(itemIds).map(itemId =>
      this.itemService.getItemById(itemId).pipe(
        map(response => {
          const categoryId = response.data?.categoryId;
          return { itemId, categoryId };
        }),
        catchError(() => of({ itemId, categoryId: null as any }))
      )
    );

    forkJoin(itemObservables)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.itemCategoryMap.clear();
          results.forEach(result => {
            if (result.categoryId) {
              const catId = result.categoryId as any;
              const categoryId = typeof catId === 'string' 
                ? catId 
                : (catId?._id || null);
              if (categoryId && typeof categoryId === 'string') {
                this.itemCategoryMap.set(result.itemId, categoryId);
              }
            }
          });
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load item categories:', err);
          this.cdr.markForCheck();
        }
      });
  }

  getContractorName(contractor: Project['contractorId']): string {
    if (!contractor) return '';
    if (typeof contractor === 'string') return contractor;
    return contractor.contractorName;
  }

  getProjectStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PLANNING': 'badge-warning',
      'ON_HOLD': 'badge-secondary',
      'CANCELLED': 'badge-danger',
      'COMPLETED': 'badge-success'
    };
    return statusMap[status] || 'badge-secondary';
  }

  getProjectStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'PLANNING': 'mdi mdi-clipboard-text',
      'ON_HOLD': 'mdi-pause-circle',
      'CANCELLED': 'mdi-cancel',
      'COMPLETED': 'mdi-check-circle'
    };
    return iconMap[status] || 'mdi-help-circle';
  }

  getItemsWithDetails(): ProjectItemWithDetails[] {
    if (!this.project?.itemsUsed) return [];
    let items = this.project.itemsUsed as unknown as ProjectItemWithDetails[];
    
    // Filter by selected category if a category is selected
    // Only filter if selectedCategoryId has a valid value (not empty string, null, or 'null')
    if (this.selectedCategoryId && 
        this.selectedCategoryId !== '' && 
        this.selectedCategoryId !== 'null' &&
        this.selectedCategoryId !== null) {
      items = items.filter(item => {
        const itemIdObj = item.itemId as any;
        const itemId = typeof itemIdObj === 'string' ? itemIdObj : itemIdObj?._id;
        if (!itemId || typeof itemId !== 'string') return false;
        
        // Get categoryId from our mapping
        const categoryId = this.itemCategoryMap.get(itemId);
        if (!categoryId) return false;
        
        return categoryId === this.selectedCategoryId;
      });
    }
    // If selectedCategoryId is empty string, null, or 'null', return all items (no filtering)
    
    return items;
  }

  getAvailableCategories(): CategoryOption[] {
    // Return only categories that are actually used in project items
    if (this.allCategories.length === 0 || this.itemCategoryMap.size === 0) return [];
    
    // Get unique category IDs from items
    const usedCategoryIds = new Set(Array.from(this.itemCategoryMap.values()));
    
    return this.allCategories
      .filter(category => usedCategoryIds.has(category._id))
      .map(category => ({
        id: category._id,
        name: category.categoryName
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  hasCategoriesLoaded(): boolean {
    return this.allCategories.length > 0 && !this.isLoadingCategories;
  }

  onCategoryChange(): void {
    // Handle standard select dropdown change
    // selectedCategoryId is automatically updated via ngModel
    // Keep empty string for "All Categories" - don't convert to null
    // This ensures the select box value sticks
    if (this.selectedCategoryId === null || this.selectedCategoryId === 'null') {
      this.selectedCategoryId = '';
    }
    // Force change detection to update the filtered list
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  getTotalUnitCost(): number {
    return this.project?.totalUnitCost || 0;
  }

  getTotalSellingCost(): number {
    return this.project?.totalSellingCost || 0;
  }

  getItemTotalCost(item: ProjectItemWithDetails): number {
    const sellingPrice = item.sellingPrice || item.itemId.sellingCost || 0;
    return item.quantity * sellingPrice;
  }

  getItemUnitCost(item: ProjectItemWithDetails): number {
    return item.unitPrice || item.itemId.unitCost || 0;
  }

  getItemSellingCost(item: ProjectItemWithDetails): number {
    return item.sellingPrice || item.itemId.sellingCost || 0;
  }

  isSuperAdmin(): boolean {
    return this.authService.hasRole('superAdmin');
  }

  isUser1(): boolean {
    return this.authService.hasRole('user1');
  }

  isUser2(): boolean {
    return this.authService.hasRole('user2');
  }

  canViewCosts(): boolean {
    return this.isSuperAdmin();
  }

  canViewUnitCosts(): boolean {
    return this.isSuperAdmin() 
  }

  canViewSellingCosts(): boolean {
    return this.isSuperAdmin() || this.isUser1();
  }

  canViewItemDetails(): boolean {
    return this.isSuperAdmin() || this.isUser1() || this.isUser2();
  }

  canViewItemQuantities(): boolean {
    return this.isSuperAdmin() || this.isUser1() || this.isUser2();
  }

  canViewItemNames(): boolean {
    return this.isSuperAdmin() || this.isUser1() || this.isUser2();
  }

  canViewAnyCosts(): boolean {
    return this.isSuperAdmin() || this.isUser1();
  }

  downloadReport(): void {
    if (!this.project) {
      this.toastService.error('No project data available for report generation');
      return;
    }

    this.generatePDFReport();
  }

  private generatePDFReport(): void {
    // Import jsPDF dynamically
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      
      // Colors
      const primaryColorR = 41;
      const primaryColorG = 128;
      const primaryColorB = 185;
      const secondaryColorR = 52;
      const secondaryColorG = 73;
      const secondaryColorB = 94;
      const accentColorR = 46;
      const accentColorG = 204;
      const accentColorB = 113;
      const lightGrayR = 236;
      const lightGrayG = 240;
      const lightGrayB = 241;
      
      // Header Section
      doc.setFillColor(primaryColorR, primaryColorG, primaryColorB);
      doc.rect(0, 0, 210, 40, 'F');
      
      // Company Logo/Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('CLOISONS', 20, 25);
      
      // Invoice/Report Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('PROJECT REPORT', 20, 35);
      
      // Report Number and Date
      doc.setFontSize(10);
      doc.text(`Report #: PR-${this.project!._id.slice(-8).toUpperCase()}`, 150, 20);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 28);
      doc.text(`Status: ${this.project!.status}`, 150, 36);
      
      // Project Information Section
      doc.setTextColor(secondaryColorR, secondaryColorG, secondaryColorB);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PROJECT DETAILS', 20, 55);
      
      // Project Info Box
      doc.setDrawColor(primaryColorR, primaryColorG, primaryColorB);
      doc.setLineWidth(0.5);
      doc.rect(20, 60, 170, 35);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      let yPos = 68;
      doc.text(`Project Name: ${this.project!.projectName}`, 25, yPos);
      yPos += 6;
      doc.text(`Contractor: ${this.getContractorName(this.project!.contractorId)}`, 25, yPos);
      yPos += 6;
      doc.text(`Start Date: ${this.project!.startDate ? new Date(this.project!.startDate).toLocaleDateString() : 'N/A'}`, 25, yPos);
      yPos += 6;
      doc.text(`End Date: ${this.project!.endDate ? new Date(this.project!.endDate).toLocaleDateString() : 'N/A'}`, 25, yPos);
      
      if (this.project!.projectDescription) {
        yPos += 6;
        doc.text(`Description: ${this.project!.projectDescription}`, 25, yPos);
      }

      // Cost Summary Section
      yPos = 110;
      if (this.canViewAnyCosts()) {
        doc.setTextColor(secondaryColorR, secondaryColorG, secondaryColorB);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('COST SUMMARY', 20, yPos);
        
        // Cost Summary Box
        doc.setFillColor(lightGrayR, lightGrayG, lightGrayB);
        doc.rect(20, yPos + 5, 170, 35, 'F');
        doc.setDrawColor(primaryColorR, primaryColorG, primaryColorB);
        doc.rect(20, yPos + 5, 170, 35);
        
        yPos += 12;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        if (this.canViewUnitCosts()) {
          doc.text(`Total Unit Cost:`, 30, yPos);
          doc.text(`AED ${this.getTotalUnitCost().toFixed(2)}`, 140, yPos);
          yPos += 7;
        }
        
        if (this.canViewSellingCosts()) {
          doc.setFont('helvetica', 'bold');
          doc.text(`Total Selling Cost:`, 30, yPos);
          doc.text(`AED ${this.getTotalSellingCost().toFixed(2)}`, 140, yPos);
          yPos += 7;
        }
        
        if (this.canViewUnitCosts() && this.canViewSellingCosts()) {
          const profit = this.getTotalSellingCost() - this.getTotalUnitCost();
          const margin = (profit / this.getTotalUnitCost()) * 100;
          doc.setTextColor(accentColorR, accentColorG, accentColorB);
          doc.text(`Profit Margin:`, 30, yPos);
          doc.text(`${margin.toFixed(1)}%`, 140, yPos);
        }
      }

      // Items Table Section
      yPos = 160;
      doc.setTextColor(secondaryColorR, secondaryColorG, secondaryColorB);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ITEMS USED', 20, yPos);
      
      const items = this.getItemsWithDetails();
      if (items.length > 0) {
        yPos += 10;
        
        // Calculate table width based on visible columns
        let tableWidth = 0;
        let columnPositions = [];
        let currentX = 25;
        
        if (this.canViewItemNames()) {
          columnPositions.push({ x: currentX, width: 50, label: 'ITEM NAME' });
          currentX += 50;
          tableWidth += 50;
        }
        if (this.canViewItemQuantities()) {
          columnPositions.push({ x: currentX, width: 15, label: 'QTY' });
          currentX += 15;
          columnPositions.push({ x: currentX, width: 20, label: 'UNIT' });
          currentX += 20;
          tableWidth += 35;
        }
        if (this.canViewUnitCosts()) {
          columnPositions.push({ x: currentX, width: 30, label: 'UNIT COST' });
          currentX += 30;
          tableWidth += 30;
        }
        if (this.canViewSellingCosts()) {
          columnPositions.push({ x: currentX, width: 35, label: 'SELLING PRICE' });
          currentX += 35;
          columnPositions.push({ x: currentX, width: 30, label: 'TOTAL' });
          currentX += 30;
          tableWidth += 65;
        }
        
        // Table Header
        doc.setFillColor(primaryColorR, primaryColorG, primaryColorB);
        doc.rect(20, yPos - 5, tableWidth + 10, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        
        columnPositions.forEach(col => {
          doc.text(col.label, col.x, yPos);
        });
        
        yPos += 8;
        
        // Table Rows
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        
        items.forEach((item, index) => {
          // Alternate row colors
          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(20, yPos - 3, tableWidth + 10, 6, 'F');
          }
          
          let colIndex = 0;
          if (this.canViewItemNames()) {
            const itemName = item.itemId.itemName.length > 18 ? item.itemId.itemName.substring(0, 18) + '...' : item.itemId.itemName;
            doc.text(itemName, columnPositions[colIndex].x, yPos);
            colIndex++;
          }
          if (this.canViewItemQuantities()) {
            doc.text(item.quantity.toString(), columnPositions[colIndex].x, yPos);
            colIndex++;
            doc.text(item.itemId.unitScale, columnPositions[colIndex].x, yPos);
            colIndex++;
          }
          if (this.canViewUnitCosts()) {
            doc.text(`AED ${this.getItemUnitCost(item).toFixed(2)}`, columnPositions[colIndex].x, yPos);
            colIndex++;
          }
          if (this.canViewSellingCosts()) {
            doc.text(`AED ${this.getItemSellingCost(item).toFixed(2)}`, columnPositions[colIndex].x, yPos);
            colIndex++;
            doc.text(`AED ${this.getItemTotalCost(item).toFixed(2)}`, columnPositions[colIndex].x, yPos);
            colIndex++;
          }
          
          yPos += 6;
          
          // Add new page if content exceeds page height
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
            
            // Redraw header on new page
            doc.setFillColor(primaryColorR, primaryColorG, primaryColorB);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('CLOISONS', 20, 25);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'normal');
            doc.text('PROJECT REPORT', 20, 35);
            
            yPos = 50;
          }
        });
        
        // Table Footer
        doc.setDrawColor(primaryColorR, primaryColorG, primaryColorB);
        doc.setLineWidth(1);
        doc.line(20, yPos - 2, 20 + tableWidth + 10, yPos - 2);
      } else {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('No items used in this project.', 25, yPos + 10);
      }

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setTextColor(secondaryColorR, secondaryColorG, secondaryColorB);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Generated by Cloisons Inventory Management System', 20, pageHeight - 20);
      doc.text(`Report generated on: ${new Date().toLocaleString()}`, 20, pageHeight - 15);
      doc.text('This is a computer-generated report.', 20, pageHeight - 10);

      // Save the PDF
      const fileName = `project-report-${this.project!.projectName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      this.toastService.success('Project report downloaded successfully');
    }).catch(error => {
      console.error('Error generating PDF:', error);
      this.toastService.error('Failed to generate PDF report');
    });
  }


  trackByItemId(index: number, item: ProjectItemWithDetails): string {
    return item.itemId._id;
  }
}
