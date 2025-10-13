import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LoaderState {
  isLoading: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class UiLoaderService {
  private loaderSubject = new BehaviorSubject<LoaderState>({
    isLoading: false,
    message: ''
  });

  public loaderState$ = this.loaderSubject.asObservable();

  constructor() {}

  /**
   * Start the loader with an optional message
   * @param message The message to display in the loader
   */
  start(message: string = 'Loading...'): void {
    console.log('UI Loader Service: Starting loader with message:', message);
    this.loaderSubject.next({
      isLoading: true,
      message: message
    });
  }

  /**
   * Stop the loader
   */
  stop(): void {
    // Only stop the loader if it is currently active
    if (this.loaderSubject.value.isLoading) {
      console.log('UI Loader Service: Stopping loader');
      this.loaderSubject.next({
        isLoading: false,
        message: ''
      });
    } else {
      console.log('UI Loader Service: stop() called, but loader is already stopped');
    }
  }

  /**
   * Get the current loader state
   */
  getLoaderState(): LoaderState {
    return this.loaderSubject.value;
  }

  /**
   * Check if loader is currently active
   */
  isLoading(): boolean {
    return this.loaderSubject.value.isLoading;
  }
}
