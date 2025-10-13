import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mat-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mat-button.component.html',
  styleUrl: './mat-button.component.scss'
})
export class MatButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'text' = 'primary';
  @Input() raised: boolean = false;
  @Input() fab: boolean = false;
  @Input() miniFab: boolean = false;
  @Input() iconButton: boolean = false;
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() loadingText: string = '';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() icon: string = '';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  
  @Output() buttonClick = new EventEmitter<void>();

  onClick(): void {
    if (!this.disabled && !this.loading) {
      this.buttonClick.emit();
    }
  }
}
