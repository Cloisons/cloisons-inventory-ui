import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-mat-textarea',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mat-textarea.component.html',
  styleUrl: './mat-textarea.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MatTextareaComponent),
      multi: true
    }
  ]
})
export class MatTextareaComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() errorMessage: string = '';
  @Input() hint: string = '';
  @Input() showLabel: boolean = true;
  @Input() rows: number = 3;
  @Input() maxLength: number = 0;
  @Input() minLength: number = 0;
  @Input() resize: 'none' | 'both' | 'horizontal' | 'vertical' = 'vertical';
  @Output() textareaChange = new EventEmitter<string>();
  @Output() textareaFocus = new EventEmitter<void>();
  @Output() textareaBlur = new EventEmitter<void>();

  value: string = '';
  isFocused: boolean = false;

  private onChange = (value: string) => {};
  private onTouched = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
    this.textareaChange.emit(this.value);
  }

  onFocus(): void {
    this.isFocused = true;
    this.textareaFocus.emit();
  }

  onBlur(): void {
    this.isFocused = false;
    this.onTouched();
    this.textareaBlur.emit();
  }

  get hasValue(): boolean {
    return !!(this.value && this.value.length > 0);
  }

  get isFloating(): boolean {
    return this.isFocused || this.hasValue;
  }

  get characterCount(): number {
    return this.value ? this.value.length : 0;
  }

  get remainingCharacters(): number {
    return this.maxLength > 0 ? this.maxLength - this.characterCount : 0;
  }

  get isOverLimit(): boolean {
    return this.maxLength > 0 && this.characterCount > this.maxLength;
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
