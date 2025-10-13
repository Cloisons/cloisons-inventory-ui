import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-material-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      [class]="buttonClasses"
      [disabled]="disabled"
      [type]="type"
      (click)="onClick($event)"
      (focus)="onFocus($event)"
      (blur)="onBlur($event)"
      [attr.aria-label]="ariaLabel"
      [attr.aria-disabled]="disabled">
      <span class="button-content">
        <ng-content></ng-content>
      </span>
      <span class="ripple" *ngIf="showRipple" [class.ripple-animate]="rippleActive"></span>
    </button>
  `,
  styleUrls: ['./material-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'text' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() disabled: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() ariaLabel: string = '';
  @Input() fullWidth: boolean = false;
  
  @Output() clicked = new EventEmitter<MouseEvent>();
  @Output() focused = new EventEmitter<FocusEvent>();
  @Output() blurred = new EventEmitter<FocusEvent>();

  rippleActive: boolean = false;
  showRipple: boolean = false;

  get buttonClasses(): string {
    const classes = [
      'material-button',
      `material-button--${this.variant}`,
      `material-button--${this.size}`,
      this.fullWidth ? 'material-button--full-width' : '',
      this.disabled ? 'material-button--disabled' : ''
    ].filter(Boolean);
    
    return classes.join(' ');
  }

  onClick(event: MouseEvent): void {
    if (!this.disabled) {
      this.triggerRipple();
      this.clicked.emit(event);
    }
  }

  onFocus(event: FocusEvent): void {
    this.focused.emit(event);
  }

  onBlur(event: FocusEvent): void {
    this.blurred.emit(event);
  }

  private triggerRipple(): void {
    this.showRipple = true;
    this.rippleActive = true;
    
    setTimeout(() => {
      this.rippleActive = false;
      setTimeout(() => {
        this.showRipple = false;
      }, 300);
    }, 100);
  }
}
