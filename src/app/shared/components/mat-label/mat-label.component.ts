import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mat-label',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label class="mat-label" [class.required]="required" [class.disabled]="disabled">
      <ng-content></ng-content>
      <span class="required-indicator" *ngIf="required">*</span>
    </label>
  `,
  styleUrl: './mat-label.component.scss'
})
export class MatLabelComponent {
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
}
