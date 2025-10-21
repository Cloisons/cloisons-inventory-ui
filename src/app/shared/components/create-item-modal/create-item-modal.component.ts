import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ItemService, ItemCreateRequest, Item } from '../../../core/services/item.service';
import { SupplierService, Supplier } from '../../../core/services/supplier.service';
import { MatInputComponent } from '../mat-input/mat-input.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-create-item-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputComponent, NgSelectModule],
  templateUrl: './create-item-modal.component.html',
  styleUrls: ['./create-item-modal.component.scss']
})
export class CreateItemModalComponent {
  @Input() isVisible = false;
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<Item>();

  form!: FormGroup;
  suppliers: Supplier[] = [];
  supplierOptions: { value: string; label: string }[] = [];
  submitting = false;
  isSuperAdmin = false;
  isUser2 = false;

  unitScaleOptions: { value: string; label: string }[] = [
    { value: 'numbers', label: 'Numbers' },
    { value: 'meters', label: 'Meters' },
    { value: 'length', label: 'Length' }
  ];

  constructor(
    private fb: FormBuilder,
    private itemService: ItemService,
    private supplierService: SupplierService,
    private authService: AuthService
  ) {
    this.isSuperAdmin = this.authService.hasRole('superAdmin');
    this.isUser2 = this.authService.hasRole('user2');
    this.form = this.createForm();
    this.loadSuppliers();
  }

  private createForm() {
    return this.fb.group({
      itemCode: ['', [Validators.maxLength(20)]],
      itemName: ['', [Validators.required, Validators.maxLength(100)]],
      itemDescription: ['', [Validators.required, Validators.maxLength(1000)]],
      supplierId: ['', Validators.required],
      unitScale: [this.isSuperAdmin ? '' : 'numbers', this.isSuperAdmin ? [Validators.required] : []],
      totalQty: [0, [Validators.required, Validators.min(0)]],
      unitCost: [0, [Validators.required, Validators.min(0)]],
      sellingCost: [undefined as number | undefined, [Validators.min(0)]],
      listedItem: [true]
    });
  }

  private loadSuppliers(): void {
    this.supplierService.listSuppliers(1, 100).subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
        this.supplierOptions = suppliers.map((s) => ({ value: s._id, label: s.supplierName }));
      },
      error: () => (this.suppliers = [])
    });
  }

  onClose(): void {
    this.closed.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.submitting = true;

    const raw = this.form.value as any;
    const payload: ItemCreateRequest & { listedItem?: boolean } = {
      itemCode: raw.itemCode,
      itemName: raw.itemName,
      itemDescription: raw.itemDescription,
      supplierId: raw.supplierId,
      unitScale: raw.unitScale,
      totalQty: Number(raw.totalQty),
      unitCost: Number(raw.unitCost),
      sellingCost: raw.sellingCost === undefined || raw.sellingCost === null || raw.sellingCost === ''
        ? undefined
        : Number(raw.sellingCost),
      listedItem: Boolean(raw.listedItem)
    };

    if (Number.isNaN(payload.totalQty)) payload.totalQty = 0;
    if (Number.isNaN(payload.unitCost)) payload.unitCost = 0;
    if (payload.sellingCost !== undefined && Number.isNaN(payload.sellingCost)) {
      payload.sellingCost = undefined;
    }

    this.itemService.createItem(payload).subscribe({
      next: (resp) => {
        this.submitting = false;
        const createdItem = resp.data as unknown as Item;
        this.created.emit(createdItem);
      },
      error: () => {
        this.submitting = false;
      }
    });
  }
}


