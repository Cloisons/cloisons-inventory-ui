import { Component, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { UiLoaderComponent } from './shared/components/ui-loader/ui-loader.component';
import { ToastService, ToastMessage } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, UiLoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  protected readonly title = signal('cloisons-inventory-ui');
  toasts: ToastMessage[] = [];

  constructor(
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
      this.cdr.markForCheck();
    });
  }

  onToastDismiss(toastId: string): void {
    this.toastService.dismiss(toastId);
  }
}
