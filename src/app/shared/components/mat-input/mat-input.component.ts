import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';

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
  @Input() formControl: FormControl | null = null;
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
    return this.value !== null && this.value !== undefined && this.value.length > 0;
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

  get hasError(): boolean {
    return this.formControl ? this.formControl.invalid && this.formControl.touched : false;
  }

  get errorText(): string {
    if (!this.formControl || !this.hasError) return '';
    
    const errors = this.formControl.errors;
    if (!errors) return '';

    // Handle different validation errors
    if (errors['required']) {
      return `${this.label} is required`;
    }
    if (errors['maxlength']) {
      return `${this.label} cannot exceed ${errors['maxlength'].requiredLength} characters`;
    }
    if (errors['minlength']) {
      return `${this.label} must be at least ${errors['minlength'].requiredLength} characters`;
    }
    if (errors['min']) {
      return `${this.label} must be at least ${errors['min'].min}`;
    }
    if (errors['max']) {
      return `${this.label} cannot exceed ${errors['max'].max}`;
    }
    if (errors['email']) {
      return 'Please enter a valid email address';
    }
    if (errors['pattern']) {
      return 'Please enter a valid format';
    }
    // Handle custom validators
    if (errors['itemCodeType']) {
      return errors['itemCodeType'].message;
    }
    if (errors['itemCodeEmpty']) {
      return errors['itemCodeEmpty'].message;
    }
    if (errors['itemCodeLength']) {
      return errors['itemCodeLength'].message;
    }
    if (errors['itemCodePattern']) {
      return errors['itemCodePattern'].message;
    }
    
    return 'Invalid input';
  }

  // ControlValueAccessor implementation
  writeValue(value: string | number): void {
    this.value = (value !== null && value !== undefined) ? String(value) : '';
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
