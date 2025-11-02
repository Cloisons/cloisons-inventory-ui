import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { LayoutComponent } from '../layout/layout.component';
import { NavItem } from '../side-nav/side-nav.component';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout-route',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LayoutComponent],
  template: `
    <app-layout 
      [pageTitle]="pageTitle"
      [navItems]="navItems"
      (navItemClick)="onNavItemClick($event)"
    >
      <router-outlet></router-outlet>
    </app-layout>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutRouteComponent implements OnInit, OnDestroy {
  pageTitle = 'Dashboard';
  navItems: NavItem[] = [];
  private destroy$ = new Subject<void>();
  private isSuperAdmin = false;
  
  // Base navigation items (available to all users)
  private baseNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'mdi-view-dashboard',
      route: '/dashboard'
    },
    {
      label: 'All Items',
      icon: 'mdi-format-list-bulleted',
      route: '/items'
    },
    {
      label: 'All Products',
      icon: 'mdi-package-variant',
      route: '/products'
    },
    {
      label: 'All Projects',
      icon: 'mdi-folder',
      route: '/projects'
    },
    {
      label: 'Categories',
      icon: 'mdi-shape-outline',
      route: '/categories'
    },
    {
      label: 'All Suppliers',
      icon: 'mdi-account-settings-outline',
      route: '/suppliers'
    },
    {
      label: 'All Contractors',
      icon: 'mdi-account-group',
      route: '/contractors'
    },
    {
      label: 'Reports',
      icon: 'mdi-chart-box',
      route: '/reports'
    }
  ];

  // Super admin only navigation items
  private superAdminNavItems: NavItem[] = [
    {
      label: 'User Management',
      icon: 'mdi-account-multiple',
      route: '/users'
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Listen to route changes to update page title
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updatePageTitle(event.url);
      });
    
    // Set initial page title
    this.updatePageTitle(this.router.url);

    // Listen to user changes to update navigation
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        this.isSuperAdmin = user ? this.authService.hasRole('superAdmin') : false;
        this.updateNavigationItems();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateNavigationItems(): void {
    this.navItems = [...this.baseNavItems];
    
    // Add super admin items if user is super admin
    if (this.isSuperAdmin) {
      this.navItems = [...this.navItems, ...this.superAdminNavItems];
    }
  }

  private updatePageTitle(url: string): void {
    const routeMap: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/profile': 'Profile',
      '/items': 'Item Management',
      '/items/add': 'Add New Item',
      '/projects': 'Project Management',
      '/suppliers': 'Supplier Management',
      '/contractors': 'Contractor Management',
      '/products': 'Product Management',
      '/products/add': 'Add New Product',
      '/products/edit': 'Edit Product',
      '/categories': 'Category Management',
      '/categories/add': 'Add New Category',
      '/categories/edit': 'Edit Category',
      '/users': 'User Management',
      '/users/add': 'Add New User',
      '/reports': 'Reports',
      '/settings': 'Settings'
    };

    this.pageTitle = routeMap[url] || 'Dashboard';
  }

  onNavItemClick(item: NavItem): void {
    // Navigation will be handled by router-outlet
    // This method can be used for additional logic if needed
  }
}
