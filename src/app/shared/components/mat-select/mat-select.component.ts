import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule, MatFormFieldAppearance } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';

export interface MatSelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  icon?: string;
  description?: string;
}

export interface MatSelectConfig {
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  showLabel?: boolean;
  label?: string;
  errorMessage?: string;
  hint?: string;
  appearance?: MatFormFieldAppearance;
  size?: 'small' | 'medium' | 'large';
  maxHeight?: number;
  panelClass?: string;
  compareWith?: (a: any, b: any) => boolean;
}

@Component({
  selector: 'app-mat-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatOptionModule
  ],
  templateUrl: './mat-select.component.html',
  styleUrl: './mat-select.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MatSelectComponent),
    multi: true
  }]
})
export class MatSelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() options: MatSelectOption[] = [];
  @Input() config: MatSelectConfig = {};
  @Input() errorMessage: string = '';
  
  // Individual input properties for easier usage
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() multiple: boolean = false;
  @Input() searchable: boolean = false;
  @Input() clearable: boolean = false;
  @Input() showLabel: boolean = true;
  @Input() hint: string = '';
  @Input() appearance: MatFormFieldAppearance = 'outline';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() maxHeight: number = 300;
  @Input() panelClass: string = '';
  @Input() compareWith: (a: any, b: any) => boolean = (a: any, b: any) => a === b;
  
  @Input() set value(val: any) {
    this._value = val;
    this.onChange(val);
  }
  get value(): any {
    return this._value;
  }

  @Output() selectionChange = new EventEmitter<any>();
  @Output() openedChange = new EventEmitter<boolean>();
  @Output() searchChange = new EventEmitter<string>();

  private _value: any = '';
  private destroy$ = new Subject<void>();
  public searchControl = new FormControl('');
  public filteredOptions: MatSelectOption[] = [];

  // Default configuration
  private defaultConfig: MatSelectConfig = {
    placeholder: 'Select an option',
    required: false,
    disabled: false,
    multiple: false,
    searchable: false,
    clearable: false,
    showLabel: true,
    label: '',
    errorMessage: '',
    hint: '',
    appearance: 'outline' as MatFormFieldAppearance,
    size: 'medium',
    maxHeight: 300,
    panelClass: '',
    compareWith: (a: any, b: any) => a === b
  };

  // Computed configuration
  get finalConfig(): MatSelectConfig {
    // Merge individual properties with config object, with individual properties taking precedence
    const individualProps: MatSelectConfig = {
      label: this.label,
      placeholder: this.placeholder,
      required: this.required,
      disabled: this.disabled,
      multiple: this.multiple,
      searchable: this.searchable,
      clearable: this.clearable,
      showLabel: this.showLabel,
      errorMessage: this.errorMessage,
      hint: this.hint,
      appearance: this.appearance,
      size: this.size,
      maxHeight: this.maxHeight,
      panelClass: this.panelClass,
      compareWith: this.compareWith
    };

    const config = { ...this.defaultConfig, ...this.config, ...individualProps };
    // Ensure compareWith always has a default value
    if (!config.compareWith) {
      config.compareWith = (a: any, b: any) => a === b;
    }
    return config;
  }

  get displayValue(): string {
    if (this.finalConfig.multiple && Array.isArray(this.value)) {
      return this.value.map(v => this.getOptionLabel(v)).join(', ');
    }
    return this.getOptionLabel(this.value);
  }

  get hasValue(): boolean {
    if (this.finalConfig.multiple) {
      return Array.isArray(this.value) && this.value.length > 0;
    }
    return this.value !== null && this.value !== undefined && this.value !== '';
  }

  get isFloating(): boolean {
    return this.hasValue || this.finalConfig.appearance === 'fill';
  }

  get currentOptions(): MatSelectOption[] {
    return this.finalConfig.searchable ? this.filteredOptions : this.options;
  }

  get compareWithFunction(): (a: any, b: any) => boolean {
    return this.finalConfig.compareWith || ((a: any, b: any) => a === b);
  }

  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.filteredOptions = [...this.options];
    
    if (this.finalConfig.searchable) {
      this.searchControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(searchTerm => {
          this.filterOptions(searchTerm || '');
          this.searchChange.emit(searchTerm || '');
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSelectionChange(value: any): void {
    this.value = value;
    this.selectionChange.emit(value);
  }

  onOpenedChange(opened: boolean): void {
    this.openedChange.emit(opened);
    if (opened && this.finalConfig.searchable) {
      // Reset search when opening
      this.searchControl.setValue('');
    }
  }

  onBlur(): void {
    this.onTouched();
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchControl.setValue(target.value);
  }

  clearSelection(): void {
    this.value = this.finalConfig.multiple ? [] : null;
    this.onSelectionChange(this.value);
  }

  removeChip(value: any): void {
    if (this.finalConfig.multiple && Array.isArray(this.value)) {
      const newValue = this.value.filter(v => !this.finalConfig.compareWith!(v, value));
      this.onSelectionChange(newValue);
    }
  }

  public getOptionLabel(value: any): string {
    const option = this.options.find(opt => this.finalConfig.compareWith!(opt.value, value));
    return option ? option.label : '';
  }

  private filterOptions(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredOptions = [...this.options];
    } else {
      this.filteredOptions = this.options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this._value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.finalConfig.disabled = isDisabled;
    this.cdr.markForCheck();
  }
}


