import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export interface NavItem {
  label: string;
  icon: string; // MDI icon class name (e.g., 'mdi-view-dashboard')
  route?: string;
}

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideNavComponent implements OnChanges, OnInit, OnDestroy {
  @Input() isExpanded: boolean = false;
  @Input() navItems: NavItem[] = [];
  @Output() itemClick = new EventEmitter<NavItem>();

  currentRoute: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Get current route on component initialization
    this.currentRoute = this.router.url;
    
    // Listen for route changes
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        this.cdr.markForCheck(); // Trigger change detection for OnPush strategy
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Component will automatically update due to OnPush change detection
  }

  onItemClick(item: NavItem): void {
    this.itemClick.emit(item);
  }

  trackByNavItem(index: number, item: NavItem): string {
    return item.label;
  }

  isActiveRoute(route: string | undefined): boolean {
    if (!route) return false;
    
    // Normalize routes by removing trailing slashes for consistent comparison
    const normalizedCurrentRoute = this.currentRoute.replace(/\/$/, '') || '/';
    const normalizedRoute = route.replace(/\/$/, '') || '/';
    
    // Handle exact matches
    if (normalizedCurrentRoute === normalizedRoute) {
      return true;
    }
    
    // Handle parent routes (e.g., if current route is '/items/add' and nav item is '/items')
    // Only match if the route is not the root and current route starts with route + '/'
    if (normalizedRoute !== '/' && normalizedCurrentRoute.startsWith(normalizedRoute + '/')) {
      return true;
    }
    
    return false;
  }
}
