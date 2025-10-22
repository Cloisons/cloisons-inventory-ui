import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MobileDetectionService {
  private isMobileSubject = new BehaviorSubject<boolean>(false);
  public isMobile$: Observable<boolean> = this.isMobileSubject.asObservable();

  constructor() {
    this.initializeMobileDetection();
  }

  private initializeMobileDetection(): void {
    // Check initial screen size
    this.checkIsMobile();

    // Listen for window resize events
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(100),
        map(() => this.checkIsMobile()),
        distinctUntilChanged(),
        startWith(this.checkIsMobile())
      )
      .subscribe(isMobile => {
        this.isMobileSubject.next(isMobile);
      });
  }

  private checkIsMobile(): boolean {
    // Check if screen width is mobile size (768px and below)
    return window.innerWidth <= 768;
  }

  public get isMobile(): boolean {
    return this.isMobileSubject.value;
  }

  public isMobileDevice(): boolean {
    // Additional check for mobile user agent
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  }

  public isMobileOrTablet(): boolean {
    // Check for both mobile and tablet devices
    return this.isMobile || this.isMobileDevice();
  }
}
