import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-mat-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mat-input.component.html',
  styleUrl: './mat-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MatInputComponent),
      multi: true
    }
  ]
})
export class MatInputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() errorMessage: string = '';
  @Input() hint: string = '';
  @Input() icon: string = '';
  @Input() showPasswordToggle: boolean = false;
  @Input() showLabel: boolean = true;
  @Output() inputChange = new EventEmitter<string>();
  @Output() inputFocus = new EventEmitter<void>();
  @Output() inputBlur = new EventEmitter<void>();

  value: string = '';
  isFocused: boolean = false;
  showPassword: boolean = false;

  private onChange = (value: string | number) => {};
  private onTouched = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    
    // For number inputs, convert to number if it's a valid number
    let outputValue: string | number = this.value;
    if (this.type === 'number' && this.value !== '') {
      const numValue = parseFloat(this.value);
      if (!isNaN(numValue)) {
        outputValue = numValue;
      }
    }
    
    this.onChange(outputValue);
    this.inputChange.emit(this.value);
  }

  onFocus(): void {
    this.isFocused = true;
    this.inputFocus.emit();
  }

  onBlur(): void {
    this.isFocused = false;
    this.onTouched();
    this.inputBlur.emit();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    this.type = this.showPassword ? 'text' : 'password';
  }

  get hasValue(): boolean {
    return !!(this.value && this.value.length > 0);
  }

  get isFloating(): boolean {
    return this.isFocused || this.hasValue;
  }

  get inputType(): string {
    if (this.showPasswordToggle && this.type === 'password') {
      return this.showPassword ? 'text' : 'password';
    }
    return this.type;
  }

  // ControlValueAccessor implementation
  writeValue(value: string | number): void {
    this.value = value ? String(value) : '';
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
