import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ItemsComponent } from './items/items.component';
import { AddItemComponent } from './items/add-item/add-item.component';
import { LayoutRouteComponent } from './shared/components/layout-route/layout-route.component';
import { AuthGuard } from './core/guards/auth.guard';
import { NonAuthGuard } from './core/guards/non-auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [NonAuthGuard]
  },
  {
    path: '',
    component: LayoutRouteComponent,
    canActivate: [AuthGuard],
    children: [
      { 
        path: 'dashboard', 
        component: DashboardComponent
      },
      {
        path: 'projects',
        loadComponent: () => import('./projects/list/projects.component').then(m => m.ProjectsComponent)
      },
      {
        path: 'projects/add',
        loadComponent: () => import('./projects/add/add-project.component').then(m => m.AddProjectComponent)
      },
      {
        path: 'projects/:id/view',
        loadComponent: () => import('./projects/view/view-project.component').then(m => m.ViewProjectComponent)
      },
      {
        path: 'projects/:id/edit',
        loadComponent: () => import('./projects/edit/edit-project.component').then(m => m.EditProjectComponent)
      },
      {
        path: 'projects/return/:id',
        loadComponent: () => import('./projects/project-return/project-return.component').then(m => m.ProjectReturnComponent)
      },
      { 
        path: 'items', 
        component: ItemsComponent
      },
      { 
        path: 'items/add', 
        component: AddItemComponent
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./suppliers/list/suppliers.component').then(m => m.SuppliersComponent)
      },
      {
        path: 'suppliers/add',
        loadComponent: () => import('./suppliers/add/add-supplier.component').then(m => m.AddSupplierComponent)
      },
      {
        path: 'suppliers/:id/edit',
        loadComponent: () => import('./suppliers/edit/edit-supplier.component').then(m => m.EditSupplierComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./products/list/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'products/add',
        loadComponent: () => import('./products/add/add-product.component').then(m => m.AddProductComponent)
      },
      {
        path: 'products/:id/edit',
        loadComponent: () => import('./products/edit/edit-product.component').then(m => m.EditProductComponent)
      },
      {
        path: 'contractors',
        loadComponent: () => import('./contractors/list/contractors.component').then(m => m.ContractorsComponent)
      },
      {
        path: 'contractors/add',
        loadComponent: () => import('./contractors/add/add-contractor.component').then(m => m.AddContractorComponent)
      },
      {
        path: 'contractors/:id/edit',
        loadComponent: () => import('./contractors/edit/edit-contractor.component').then(m => m.EditContractorComponent)
      },
      {
        path: 'items/:id',
        loadComponent: () => import('./items/view-item/view-item.component').then(m => m.ViewItemComponent)
      },
      {
        path: 'items/:id/edit',
        loadComponent: () => import('./items/edit-item/edit-item.component').then(m => m.EditItemComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./users/list/users.component').then(m => m.UsersComponent),
        canActivate: [RoleGuard],
        data: { expectedRole: 'superAdmin' }
      },
      {
        path: 'users/add',
        loadComponent: () => import('./users/add/add-user.component').then(m => m.AddUserComponent),
        canActivate: [RoleGuard],
        data: { expectedRole: 'superAdmin' }
      },
      {
        path: 'users/:id/edit',
        loadComponent: () => import('./users/edit/edit-user.component').then(m => m.EditUserComponent),
        canActivate: [RoleGuard],
        data: { expectedRole: 'superAdmin' }
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'reports/item-level',
        loadComponent: () => import('./reports/item-level-report/item-level-report.component').then(m => m.ItemLevelReportComponent)
      },
      {
        path: 'reports/project-level',
        loadComponent: () => import('./reports/project-level-report/project-level-report.component').then(m => m.ProjectLevelReportComponent)
      },
      {
        path: 'reports/supplier-level',
        loadComponent: () => import('./reports/supplier-level-report/supplier-level-report.component').then(m => m.SupplierLevelReportComponent)
      },
      // Add more protected routes here as children
    ]
  },
  { path: '**', redirectTo: '/login' }
];
