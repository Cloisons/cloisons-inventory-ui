# Mat Select Component

A comprehensive, reusable Angular Material select component with advanced features and customization options.

## Features

- ✅ **Angular Material Integration** - Built on top of Angular Material components
- ✅ **Form Integration** - Full support for Angular Reactive Forms and Template-driven forms
- ✅ **Multiple Selection** - Support for single and multiple selection modes
- ✅ **Search Functionality** - Built-in search/filter capabilities
- ✅ **Custom Styling** - Extensive theming and appearance options
- ✅ **Accessibility** - Full ARIA support and keyboard navigation
- ✅ **TypeScript Support** - Strongly typed interfaces and configurations
- ✅ **Responsive Design** - Mobile-friendly and responsive layouts
- ✅ **Icon Support** - Options with icons and descriptions
- ✅ **Clear Functionality** - Easy selection clearing
- ✅ **Chip Display** - Selected values displayed as removable chips
- ✅ **Custom Comparison** - Custom value comparison functions

## Installation

The component is already included in the shared components. Make sure you have Angular Material installed:

```bash
ng add @angular/material
```

## Basic Usage

### Simple Select

```typescript
import { MatSelectComponent, MatSelectOption } from './shared/components/mat-select/mat-select.component';

@Component({
  template: `
    <app-mat-select
      [options]="options"
      [config]="config"
      [(ngModel)]="selectedValue"
      (selectionChange)="onSelectionChange($event)">
    </app-mat-select>
  `
})
export class MyComponent {
  options: MatSelectOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];

  config: MatSelectConfig = {
    label: 'Select an option',
    placeholder: 'Choose...',
    required: true
  };

  selectedValue: string = '';

  onSelectionChange(value: string): void {
    console.log('Selected:', value);
  }
}
```

### Multiple Selection

```typescript
const multipleConfig: MatSelectConfig = {
  label: 'Select Technologies',
  placeholder: 'Choose technologies',
  multiple: true,
  clearable: true
};

const multipleOptions: MatSelectOption[] = [
  { value: 'angular', label: 'Angular' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue.js' }
];
```

### Searchable Select

```typescript
const searchableConfig: MatSelectConfig = {
  label: 'Search Countries',
  placeholder: 'Search and select...',
  searchable: true,
  clearable: true
};

const searchableOptions: MatSelectOption[] = [
  { value: 'usa', label: 'United States', description: 'North America' },
  { value: 'uk', label: 'United Kingdom', description: 'Europe' }
];
```

### With Icons and Descriptions

```typescript
const iconOptions: MatSelectOption[] = [
  { value: 'home', label: 'Home', icon: 'home', description: 'Go to home page' },
  { value: 'settings', label: 'Settings', icon: 'settings', description: 'Manage preferences' }
];
```

## Configuration Options

### MatSelectConfig Interface

```typescript
interface MatSelectConfig {
  placeholder?: string;           // Placeholder text
  required?: boolean;            // Required field indicator
  disabled?: boolean;            // Disabled state
  multiple?: boolean;            // Multiple selection mode
  searchable?: boolean;          // Enable search functionality
  clearable?: boolean;           // Show clear button
  showLabel?: boolean;           // Show/hide label
  label?: string;                // Label text
  errorMessage?: string;         // Error message
  hint?: string;                 // Hint text
  appearance?: 'fill' | 'outline'; // Material appearance
  size?: 'small' | 'medium' | 'large'; // Component size
  maxHeight?: number;            // Max height of dropdown
  panelClass?: string;           // Custom panel CSS class
  compareWith?: (a: any, b: any) => boolean; // Custom comparison function
}
```

### MatSelectOption Interface

```typescript
interface MatSelectOption {
  value: any;                    // Option value
  label: string;                 // Display label
  disabled?: boolean;            // Disabled state
  icon?: string;                 // Material icon name
  description?: string;          // Additional description
}
```

## Form Integration

### Reactive Forms

```typescript
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  template: `
    <form [formGroup]="myForm">
      <app-mat-select
        [options]="options"
        [config]="config"
        formControlName="mySelect">
      </app-mat-select>
    </form>
  `
})
export class MyComponent {
  myForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.myForm = this.fb.group({
      mySelect: ['', Validators.required]
    });
  }
}
```

### Template-driven Forms

```typescript
@Component({
  template: `
    <app-mat-select
      [options]="options"
      [config]="config"
      [(ngModel)]="selectedValue"
      name="mySelect"
      #mySelect="ngModel"
      required>
    </app-mat-select>
  `
})
export class MyComponent {
  selectedValue: string = '';
}
```

## Styling and Theming

### Size Variations

```typescript
const smallConfig: MatSelectConfig = { size: 'small' };
const mediumConfig: MatSelectConfig = { size: 'medium' };
const largeConfig: MatSelectConfig = { size: 'large' };
```

### Appearance Options

```typescript
const outlineConfig: MatSelectConfig = { appearance: 'outline' };
const fillConfig: MatSelectConfig = { appearance: 'fill' };
```

### Custom Panel Styling

```typescript
const customConfig: MatSelectConfig = {
  panelClass: 'custom-panel',
  maxHeight: 400
};
```

## Events

### Available Output Events

```typescript
@Component({
  template: `
    <app-mat-select
      [options]="options"
      [config]="config"
      (selectionChange)="onSelectionChange($event)"
      (openedChange)="onOpenedChange($event)"
      (searchChange)="onSearchChange($event)">
    </app-mat-select>
  `
})
export class MyComponent {
  onSelectionChange(value: any): void {
    // Fired when selection changes
  }

  onOpenedChange(opened: boolean): void {
    // Fired when dropdown opens/closes
  }

  onSearchChange(searchTerm: string): void {
    // Fired when search term changes (searchable mode)
  }
}
```

## Advanced Features

### Custom Comparison Function

```typescript
const config: MatSelectConfig = {
  compareWith: (a: any, b: any) => a.id === b.id
};

const options: MatSelectOption[] = [
  { value: { id: 1, name: 'Option 1' }, label: 'Option 1' },
  { value: { id: 2, name: 'Option 2' }, label: 'Option 2' }
];
```

### Custom Styling

The component supports extensive CSS customization through CSS variables and classes:

```scss
// Custom theme colors
.mat-select-field {
  --primary-color: #1976d2;
  --error-color: #f44336;
  --border-color: #BEC0D3;
}

// Custom panel styling
::ng-deep .mat-mdc-select-panel.custom-panel {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
```

## Accessibility

The component includes full accessibility support:

- ARIA labels and descriptions
- Keyboard navigation
- Screen reader support
- Focus management
- High contrast mode support

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

- Angular 15+
- Angular Material 15+
- RxJS 7+

## Examples

See `mat-select-example.component.ts` for comprehensive usage examples including:

- Basic single selection
- Multiple selection with chips
- Searchable dropdowns
- Form integration
- Different sizes and appearances
- Custom styling examples

## Troubleshooting

### Common Issues

1. **Options not displaying**: Ensure `options` array is properly initialized
2. **Form validation not working**: Check that `required` is set in config and form validators
3. **Styling issues**: Verify Angular Material theme is properly imported
4. **Search not working**: Ensure `searchable: true` is set in config

### Performance Tips

1. Use `compareWith` function for complex objects
2. Implement virtual scrolling for large option lists
3. Debounce search input for better performance
4. Use `OnPush` change detection strategy when possible

## Contributing

When contributing to this component:

1. Follow the existing code style
2. Add comprehensive tests
3. Update documentation
4. Ensure accessibility compliance
5. Test across different browsers and devices
