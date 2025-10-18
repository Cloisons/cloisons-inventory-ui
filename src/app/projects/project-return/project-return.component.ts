import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService, ReturnItem, ProjectReturnEligibility, ProjectReturnResponse } from '../../core/services/project.service';

interface ProjectItem {
  itemId: string | { _id: string; itemName: string; unitScale?: string };
  quantity: number;
  unitCost?: number | null;
  sellingPrice?: number | null;
  unitPrice?: number | null;
  listedItem?: boolean;
}

interface SelectedReturnItem extends ReturnItem {
  itemName: string;
  maxQuantity: number;
  unitCost: number;
  sellingPrice: number;
}

@Component({
  selector: 'app-project-return',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './project-return.component.html',
  styleUrls: ['./project-return.component.scss']
})
export class ProjectReturnComponent implements OnInit {
  projectId: string = '';
  project: any = null;
  projectItems: ProjectItem[] = [];
  selectedItems: SelectedReturnItem[] = [];
  eligibility: ProjectReturnEligibility | null = null;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.projectId) {
      this.router.navigate(['/projects']);
      return;
    }

    this.loadProjectDetails();
  }

  loadProjectDetails(): void {
    console.log('Starting loadProjectDetails, isLoading:', this.isLoading);
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    console.log('Set isLoading to true, current value:', this.isLoading);

    // Set a timeout fallback to ensure loading state is cleared
    const loadingTimeout = setTimeout(() => {
      if (this.isLoading) {
        console.warn('Loading timeout - forcing loading state to false');
        this.isLoading = false;
      }
    }, 10000); // 10 second timeout

    console.log('Making API call to getProject with ID:', this.projectId);
    this.projectService.getProject(this.projectId).subscribe({
      next: (project) => {
        console.log('API call successful, received project:', project);
        clearTimeout(loadingTimeout); // Clear the timeout since we got a response
        this.project = project;
        
        // Check if project is eligible for returns
        if (project.returnEligibility?.isEligible === true) {
          console.log('Project is eligible for returns');
          this.eligibility = project.returnEligibility;
          
          // Transform project items to match our interface
          this.projectItems = (project.itemsUsed || []).map(item => ({
            ...item,
            itemId: typeof item.itemId === 'object' ? item.itemId : { _id: item.itemId, itemName: 'Unknown Item' }
          }));
          
          // Ensure loading is set to false
          this.isLoading = false;
          this.cdr.detectChanges(); // Force change detection
          console.log('Set isLoading to false for eligible project, current value:', this.isLoading);
        } else {
          console.log('Project is not eligible for returns:', project.returnEligibility?.reason);
          // Project is not eligible for returns, show error and redirect
          this.errorMessage = project.returnEligibility?.reason || 'Project is not eligible for returns';
          this.isLoading = false;
          this.cdr.detectChanges(); // Force change detection
          console.log('Set isLoading to false for non-eligible project, current value:', this.isLoading);
          
          // Redirect after a short delay to show the error message
          setTimeout(() => {
            this.router.navigate(['/projects']);
          }, 3000);
        }
      },
      error: (error) => {
        console.error('API call failed:', error);
        clearTimeout(loadingTimeout); // Clear the timeout since we got an error
        this.errorMessage = error.message || 'Failed to load project details';
        this.isLoading = false;
        this.cdr.detectChanges(); // Force change detection
        console.log('Set isLoading to false for error, current value:', this.isLoading);
      }
    });
  }

  onQuantityChange(item: ProjectItem, quantity: number): void {
    const itemId = typeof item.itemId === 'object' ? item.itemId._id : item.itemId;
    const existingIndex = this.selectedItems.findIndex(selected => selected.itemId === itemId);
    
    // Clear previous errors
    this.errorMessage = '';
    
    // Validate quantity
    if (quantity < 0) {
      this.errorMessage = 'Quantity cannot be negative';
      return;
    }
    
    if (quantity > item.quantity) {
      this.errorMessage = `Return quantity cannot exceed available quantity (${item.quantity})`;
      return;
    }
    
    if (quantity > 0) {
      const selectedItem: SelectedReturnItem = {
        itemId: itemId,
        quantity: quantity,
        itemName: this.getItemName(item),
        maxQuantity: item.quantity,
        unitCost: item.unitCost || 0,
        sellingPrice: item.sellingPrice || 0
      };

      if (existingIndex >= 0) {
        this.selectedItems[existingIndex] = selectedItem;
      } else {
        this.selectedItems.push(selectedItem);
      }
    } else {
      // Remove item if quantity is 0
      if (existingIndex >= 0) {
        this.selectedItems.splice(existingIndex, 1);
      }
    }
  }

  selectAllItems(item: ProjectItem): void {
    this.onQuantityChange(item, item.quantity);
  }

  clearAllSelections(): void {
    this.selectedItems = [];
    this.errorMessage = '';
  }

  getSelectedItemsCount(): number {
    return this.selectedItems.filter(item => item.quantity > 0).length;
  }

  getTotalReturnValue(): number {
    return this.selectedItems.reduce((total, item) => {
      return total + (item.sellingPrice * item.quantity);
    }, 0);
  }

  canSubmitReturn(): boolean {
    return this.selectedItems.length > 0 && 
           this.selectedItems.some(item => item.quantity > 0) &&
           !this.isSubmitting &&
           this.eligibility?.isEligible === true;
  }

  submitReturn(): void {
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';
    
    // Validate before submission
    if (!this.canSubmitReturn()) {
      if (this.selectedItems.length === 0) {
        this.errorMessage = 'Please select at least one item to return';
      } else if (!this.selectedItems.some(item => item.quantity > 0)) {
        this.errorMessage = 'Please enter quantities for the items you want to return';
      } else if (!this.eligibility?.isEligible) {
        this.errorMessage = 'Project is not eligible for returns';
      }
      return;
    }

    const returnItems: ReturnItem[] = this.selectedItems
      .filter(item => item.quantity > 0)
      .map(item => ({
        itemId: item.itemId,
        quantity: item.quantity
      }));

    // Double-check we have items to return
    if (returnItems.length === 0) {
      this.errorMessage = 'Please select at least one item to return';
      return;
    }

    // Confirm submission
    const totalValue = this.getTotalReturnValue();
    const confirmMessage = `Are you sure you want to return ${returnItems.length} item(s) with a total value of ${this.formatCurrency(totalValue)}?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    this.isSubmitting = true;

    this.projectService.submitReturn(this.projectId, returnItems).subscribe({
      next: (response) => {
        this.successMessage = 'Items returned successfully!';
        this.selectedItems = [];
        this.loadProjectDetails(); // Refresh project details
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to submit return. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  getSelectedQuantity(itemId: string): number {
    const selectedItem = this.selectedItems.find(item => item.itemId === itemId);
    return selectedItem ? selectedItem.quantity : 0;
  }

  getItemName(item: ProjectItem): string {
    if (typeof item.itemId === 'object' && item.itemId.itemName) {
      return item.itemId.itemName;
    } else if (typeof item.itemId === 'string') {
      // Find item where itemId is either a string matching the itemId or an object with _id matching the itemId
      const itemDetails = this.projectItems.find(i => {
        if (typeof i.itemId === 'string') {
          return i.itemId === item.itemId;
        } else if (typeof i.itemId === 'object' && i.itemId._id) {
          return i.itemId._id === item.itemId;
        }
        return false;
      });
      
      if (itemDetails) {
        if (typeof itemDetails.itemId === 'object' && itemDetails.itemId.itemName) {
          return itemDetails.itemId.itemName;
        } else if (typeof itemDetails.itemId === 'string') {
          return 'Unknown Item'; // If itemId is a string, we don't have the name
        }
      }
      return 'Unknown Item';
    }
    return 'Unknown Item';
  }
}
