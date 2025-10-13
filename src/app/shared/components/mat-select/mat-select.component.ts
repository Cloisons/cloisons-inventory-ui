import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface MatSelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-mat-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mat-select.component.html',
  styleUrl: './mat-select.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MatSelectComponent),
    multi: true
  }]
})
export class MatSelectComponent implements ControlValueAccessor {
  @Input() placeholder: string = 'Select';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() showLabel: boolean = true;
  @Input() label: string = '';
  @Input() errorMessage: string = '';
  @Input() options: MatSelectOption[] = [];

  @Output() selectionChange = new EventEmitter<string>();

  value: string = '';
  isFocused = false;

  private onChange = (v: string) => {};
  private onTouched = () => {};

  onFocus() { this.isFocused = true; }
  onBlur() { this.isFocused = false; this.onTouched(); }

  onSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChange(this.value);
    this.selectionChange.emit(this.value);
  }

  writeValue(v: string): void { this.value = v || ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}


