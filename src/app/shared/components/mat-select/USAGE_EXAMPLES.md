# Mat Select Component - Usage Examples

## Basic Usage

### Method 1: Individual Properties (Recommended for simple usage)
```typescript
import { MatSelectComponent, MatSelectOption } from './shared/components/mat-select/mat-select.component';

@Component({
  template: `
    <app-mat-select
      [options]="options"
      label="Select an option"
      placeholder="Choose..."
      [required]="true"
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

  selectedValue: string = '';

  onSelectionChange(value: string): void {
    console.log('Selected:', value);
  }
}
```

### Method 2: Config Object (Recommended for complex configurations)
```typescript
import { MatSelectComponent, MatSelectOption, MatSelectConfig } from './shared/components/mat-select/mat-select.component';

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

#### Method 1: Individual Properties
```typescript
<app-mat-select
  [options]="multipleOptions"
  label="Select Technologies"
  placeholder="Choose technologies"
  [multiple]="true"
  [clearable]="true"
  [(ngModel)]="multipleValue">
</app-mat-select>
```

#### Method 2: Config Object
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

#### Method 1: Individual Properties
```typescript
<app-mat-select
  [options]="searchableOptions"
  label="Search Countries"
  placeholder="Search and select..."
  [searchable]="true"
  [clearable]="true"
  [(ngModel)]="searchableValue">
</app-mat-select>
```

#### Method 2: Config Object
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

## Configuration Options

### All Available Options
```typescript
const fullConfig: MatSelectConfig = {
  placeholder: 'Select an option',        // Placeholder text
  required: true,                         // Required field indicator
  disabled: false,                        // Disabled state
  multiple: false,                        // Multiple selection mode
  searchable: false,                      // Enable search functionality
  clearable: true,                        // Show clear button
  showLabel: true,                        // Show/hide label
  label: 'My Label',                      // Label text
  errorMessage: '',                       // Error message
  hint: 'This is a hint',                // Hint text
  appearance: 'outline',                  // 'fill' | 'outline'
  size: 'medium',                         // 'small' | 'medium' | 'large'
  maxHeight: 300,                         // Max height of dropdown
  panelClass: 'custom-panel',             // Custom panel CSS class
  compareWith: (a: any, b: any) => a.id === b.id  // Custom comparison function
};
```

## Styling Examples

### Different Sizes
```typescript
const smallConfig: MatSelectConfig = { size: 'small' };
const mediumConfig: MatSelectConfig = { size: 'medium' };
const largeConfig: MatSelectConfig = { size: 'large' };
```

### Different Appearances
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
    console.log('Selection changed:', value);
  }

  onOpenedChange(opened: boolean): void {
    // Fired when dropdown opens/closes
    console.log('Dropdown opened:', opened);
  }

  onSearchChange(searchTerm: string): void {
    // Fired when search term changes (searchable mode)
    console.log('Search term:', searchTerm);
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

### Error Handling
```typescript
@Component({
  template: `
    <app-mat-select
      [options]="options"
      [config]="config"
      [errorMessage]="getErrorMessage()"
      [(ngModel)]="selectedValue">
    </app-mat-select>
  `
})
export class MyComponent {
  getErrorMessage(): string {
    if (this.selectedValue === '') {
      return 'Please select an option';
    }
    return '';
  }
}
```

## Complete Example

Here's a complete working example:

```typescript
import { Component } from '@angular/core';
import { MatSelectComponent, MatSelectOption, MatSelectConfig } from './shared/components/mat-select/mat-select.component';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [MatSelectComponent],
  template: `
    <div class="container">
      <h2>Mat Select Examples</h2>
      
      <!-- Basic Select -->
      <app-mat-select
        [options]="basicOptions"
        [config]="basicConfig"
        [(ngModel)]="basicValue"
        (selectionChange)="onBasicChange($event)">
      </app-mat-select>
      
      <!-- Multiple Select -->
      <app-mat-select
        [options]="multipleOptions"
        [config]="multipleConfig"
        [(ngModel)]="multipleValue"
        (selectionChange)="onMultipleChange($event)">
      </app-mat-select>
      
      <!-- Searchable Select -->
      <app-mat-select
        [options]="searchableOptions"
        [config]="searchableConfig"
        [(ngModel)]="searchableValue"
        (selectionChange)="onSearchableChange($event)">
      </app-mat-select>
    </div>
  `
})
export class ExampleComponent {
  // Basic select
  basicValue: string = '';
  basicOptions: MatSelectOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ];
  basicConfig: MatSelectConfig = {
    label: 'Basic Select',
    placeholder: 'Choose an option',
    required: true
  };

  // Multiple select
  multipleValue: string[] = [];
  multipleOptions: MatSelectOption[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue.js' }
  ];
  multipleConfig: MatSelectConfig = {
    label: 'Select Technologies',
    placeholder: 'Choose technologies',
    multiple: true,
    clearable: true
  };

  // Searchable select
  searchableValue: string = '';
  searchableOptions: MatSelectOption[] = [
    { value: 'usa', label: 'United States', description: 'North America' },
    { value: 'uk', label: 'United Kingdom', description: 'Europe' },
    { value: 'japan', label: 'Japan', description: 'Asia' }
  ];
  searchableConfig: MatSelectConfig = {
    label: 'Search Countries',
    placeholder: 'Search and select...',
    searchable: true,
    clearable: true
  };

  onBasicChange(value: string): void {
    console.log('Basic selection:', value);
  }

  onMultipleChange(value: string[]): void {
    console.log('Multiple selection:', value);
  }

  onSearchableChange(value: string): void {
    console.log('Searchable selection:', value);
  }
}
```

This component is now ready to use throughout your application!
