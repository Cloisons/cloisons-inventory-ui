import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-user-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<label *ngIf="label" [attr.for]="id">{{ label }}</label>
<input
  class="form-control"
  [attr.id]="id"
  [attr.type]="type"
  [placeholder]="placeholder"
  [required]="required"
  [disabled]="disabled"
  [ngModel]="value"
  (ngModelChange)="handleInput($event)"
  (blur)="handleBlur()"
/>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UserInputComponent),
      multi: true
    }
  ]
})
export class UserInputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() type: 'text' | 'number' | 'email' | 'password' = 'text';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() id: string | null = null;

  value: any = '';
  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: any): void { this.value = val; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  handleInput(val: any): void {
    this.value = this.type === 'number' ? (val === '' || val === null ? null : Number(val)) : val;
    this.onChange(this.value);
  }
  handleBlur(): void { this.onTouched(); }
}


