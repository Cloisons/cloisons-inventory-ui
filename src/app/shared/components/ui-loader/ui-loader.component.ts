import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UiLoaderService, LoaderState } from '../../../core/services/ui-loader.service';

@Component({
  selector: 'app-ui-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-loader-overlay" *ngIf="loaderState.isLoading">
      <div class="ui-loader-container">
        <div class="ui-loader-spinner">
          <i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
        </div>
        <div class="ui-loader-message" *ngIf="loaderState.message">
          {{ loaderState.message }}
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./ui-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiLoaderComponent implements OnInit, OnDestroy {
  loaderState: LoaderState = { isLoading: false, message: '' };
  private subscription?: Subscription;

  constructor(
    private uiLoaderService: UiLoaderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription = this.uiLoaderService.loaderState$.subscribe(state => {
      this.loaderState = state;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
