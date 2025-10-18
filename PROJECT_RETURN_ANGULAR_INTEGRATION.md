# Project Return Angular Integration Guide

This guide explains how to integrate the project return functionality into your Angular application.

## Overview

The project return functionality consists of:
- **Backend API**: Already implemented with restrictions for completed projects
- **Angular Services**: Handle API communication and business logic
- **Angular Components**: UI components for return functionality
- **Integration Helpers**: Services to add return buttons to existing components

## File Structure

```
src/app/
├── core/services/
│   ├── project-return.service.ts          # Main service for return operations
│   └── project-ui.service.ts              # Helper service for UI integration
├── projects/
│   ├── project-return/                    # Return page module
│   │   ├── project-return.component.ts
│   │   ├── project-return.component.html
│   │   ├── project-return.component.scss
│   │   ├── project-return.module.ts
│   │   └── project-return-routing.module.ts
│   └── project-list-integration-example.component.ts  # Example integration
└── shared/components/
    └── project-return-button/             # Reusable return button
        ├── project-return-button.component.ts
        ├── project-return-button.component.html
        ├── project-return-button.component.scss
        └── project-return-button.module.ts
```

## Setup Instructions

### 1. Add Routes

Add the return route to your main routing module:

```typescript
// app-routing.module.ts
const routes: Routes = [
  // ... existing routes
  {
    path: 'projects/return/:id',
    loadChildren: () => import('./projects/project-return/project-return.module').then(m => m.ProjectReturnModule)
  }
];
```

### 2. Import Modules

Add the required modules to your app module or feature modules:

```typescript
// app.module.ts or projects.module.ts
import { ProjectReturnButtonModule } from './shared/components/project-return-button/project-return-button.module';

@NgModule({
  imports: [
    // ... other imports
    ProjectReturnButtonModule
  ]
})
export class AppModule { }
```

### 3. Update Your Project List Component

#### Option A: Using the Helper Service (Recommended)

```typescript
// your-project-list.component.ts
import { ProjectUiService, ProjectWithReturnInfo } from '../core/services/project-ui.service';

export class YourProjectListComponent implements OnInit {
  projects: ProjectWithReturnInfo[] = [];

  constructor(private projectUiService: ProjectUiService) {}

  loadProjects() {
    // Your existing project loading logic
    this.projectService.getProjects().subscribe(projects => {
      this.projectUiService.enhanceProjectsWithReturnInfo(projects).subscribe(enhancedProjects => {
        this.projects = enhancedProjects;
      });
    });
  }

  onReturnClick(projectId: string) {
    this.router.navigate(['/projects/return', projectId]);
  }
}
```

#### Option B: Manual Integration

```typescript
// your-project-list.component.ts
import { ProjectReturnService } from '../core/services/project-return.service';

export class YourProjectListComponent implements OnInit {
  projects: any[] = [];

  constructor(private projectReturnService: ProjectReturnService) {}

  checkReturnEligibility(projectId: string) {
    return this.projectReturnService.checkReturnEligibility(projectId);
  }
}
```

### 4. Update Your Project List Template

Add the return button to your project list template:

```html
<!-- your-project-list.component.html -->
<table class="table">
  <tbody>
    <tr *ngFor="let project of projects">
      <td>{{ project.projectName }}</td>
      <td>{{ project.status }}</td>
      <td>
        <div class="btn-group">
          <!-- Existing buttons -->
          <button class="btn btn-sm btn-primary" (click)="editProject(project._id)">Edit</button>
          <button class="btn btn-sm btn-danger" (click)="deleteProject(project._id)">Delete</button>
          
          <!-- Return button -->
          <app-project-return-button
            [projectId]="project._id"
            [eligibility]="project.returnEligibility"
            [size]="'sm'"
            [showIcon]="true"
            [showTooltip]="true"
            (returnClick)="onReturnClick($event)">
          </app-project-return-button>
        </div>
      </td>
    </tr>
  </tbody>
</table>
```

## API Integration

### Service Usage

```typescript
// Inject the service
constructor(private projectReturnService: ProjectReturnService) {}

// Check eligibility
this.projectReturnService.checkReturnEligibility(projectId).subscribe(eligibility => {
  console.log('Can return:', eligibility.isEligible);
  console.log('Reason:', eligibility.reason);
});

// Submit return
const returnItems = [
  { itemId: 'item1', quantity: 3 },
  { itemId: 'item2', quantity: 1 }
];

this.projectReturnService.submitReturn(projectId, returnItems).subscribe(response => {
  console.log('Return successful:', response);
});
```

### Error Handling

```typescript
this.projectReturnService.submitReturn(projectId, returnItems).subscribe({
  next: (response) => {
    // Handle success
    this.showSuccessMessage('Items returned successfully!');
  },
  error: (error) => {
    // Handle error
    this.showErrorMessage(error.message || 'Failed to return items');
  }
});
```

## Styling

### Bootstrap Classes

The components use Bootstrap classes. Ensure you have Bootstrap CSS included:

```html
<!-- In your index.html or angular.json -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
```

### Custom Styling

You can customize the appearance by overriding the component styles:

```scss
// your-component.component.scss
app-project-return-button {
  .btn-warning {
    background-color: #your-color;
    border-color: #your-color;
  }
}
```

## Features

### 1. Automatic Eligibility Checking
- Checks if project is completed
- Validates 30-day return window
- Tracks return submission count
- Updates button state accordingly

### 2. Smart Button States
- **Enabled**: Project is eligible for returns
- **Disabled**: Project not eligible (with tooltip explaining why)
- **Loading**: Checking eligibility

### 3. Return Page Features
- Project details display
- Item selection with quantity validation
- Real-time price calculation
- Return submission tracking
- Responsive design

### 4. Integration Features
- Easy integration with existing components
- Reusable return button component
- Helper services for common operations
- TypeScript interfaces for type safety

## Testing

### Unit Tests

```typescript
// project-return.service.spec.ts
describe('ProjectReturnService', () => {
  let service: ProjectReturnService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectReturnService]
    });
    service = TestBed.inject(ProjectReturnService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should check return eligibility', () => {
    const mockProject = { status: 'COMPLETED', endDate: new Date().toISOString() };
    
    service.checkReturnEligibility('project1').subscribe(eligibility => {
      expect(eligibility.isEligible).toBe(true);
    });

    const req = httpMock.expectOne('/api/projects/project1');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { project: mockProject } });
  });
});
```

### Integration Tests

```typescript
// project-return.component.spec.ts
describe('ProjectReturnComponent', () => {
  let component: ProjectReturnComponent;
  let fixture: ComponentFixture<ProjectReturnComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProjectReturnComponent],
      imports: [HttpClientTestingModule, RouterTestingModule]
    });
    fixture = TestBed.createComponent(ProjectReturnComponent);
    component = fixture.componentInstance;
  });

  it('should load project details', () => {
    // Test implementation
  });
});
```

## Troubleshooting

### Common Issues

1. **Button not showing**: Ensure the project status is 'COMPLETED'
2. **API errors**: Check your API base URL in environment.ts
3. **Styling issues**: Ensure Bootstrap CSS is loaded
4. **Type errors**: Check that all interfaces are properly imported

### Debug Tips

1. Check browser console for errors
2. Use Angular DevTools to inspect component state
3. Verify API responses in Network tab
4. Check that all required modules are imported

## Security Considerations

1. **Authentication**: Ensure JWT tokens are properly handled
2. **Authorization**: Verify user permissions for return operations
3. **Input Validation**: Both client and server-side validation
4. **Error Handling**: Don't expose sensitive information in error messages

## Performance Optimization

1. **Lazy Loading**: Return page is lazy-loaded
2. **Caching**: Consider caching eligibility checks
3. **Debouncing**: For real-time validation
4. **OnPush**: Use OnPush change detection for better performance

## Maintenance

### Updates
- Monitor API changes
- Update interfaces when backend changes
- Keep dependencies updated
- Test after Angular updates

### Monitoring
- Track return submission rates
- Monitor error rates
- Check performance metrics
- User feedback collection
