import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatSelectComponent, MatSelectOption, MatSelectConfig } from './mat-select.component';

@Component({
  selector: 'app-mat-select-example',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSelectComponent],
  template: `
    <div class="example-container">
      <h2>Mat Select Component Examples</h2>
      
      <!-- Basic Single Select -->
      <div class="example-section">
        <h3>Basic Single Select</h3>
        <app-mat-select
          [options]="basicOptions"
          [config]="basicConfig"
          [(ngModel)]="basicValue"
          (selectionChange)="onBasicSelectionChange($event)"
        ></app-mat-select>
        <p>Selected: {{ basicValue }}</p>
      </div>

      <!-- Multiple Select with Chips -->
      <div class="example-section">
        <h3>Multiple Select with Chips</h3>
        <app-mat-select
          [options]="multipleOptions"
          [config]="multipleConfig"
          [(ngModel)]="multipleValue"
          (selectionChange)="onMultipleSelectionChange($event)"
        ></app-mat-select>
        <p>Selected: {{ multipleValue | json }}</p>
      </div>

      <!-- Searchable Select -->
      <div class="example-section">
        <h3>Searchable Select</h3>
        <app-mat-select
          [options]="searchableOptions"
          [config]="searchableConfig"
          [(ngModel)]="searchableValue"
          (selectionChange)="onSearchableSelectionChange($event)"
          (searchChange)="onSearchChange($event)"
        ></app-mat-select>
        <p>Selected: {{ searchableValue }}</p>
      </div>

      <!-- Select with Icons and Descriptions -->
      <div class="example-section">
        <h3>Select with Icons and Descriptions</h3>
        <app-mat-select
          [options]="iconOptions"
          [config]="iconConfig"
          [(ngModel)]="iconValue"
          (selectionChange)="onIconSelectionChange($event)"
        ></app-mat-select>
        <p>Selected: {{ iconValue }}</p>
      </div>

      <!-- Form Integration -->
      <div class="example-section">
        <h3>Form Integration</h3>
        <form [formGroup]="exampleForm" (ngSubmit)="onSubmit()">
          <app-mat-select
            [options]="formOptions"
            [config]="formConfig"
            formControlName="country"
          ></app-mat-select>
          
          <app-mat-select
            [options]="formMultipleOptions"
            [config]="formMultipleConfig"
            formControlName="skills"
          ></app-mat-select>
          
          <button type="submit" [disabled]="exampleForm.invalid">Submit</button>
        </form>
        <p>Form Value: {{ exampleForm.value | json }}</p>
        <p>Form Valid: {{ exampleForm.valid }}</p>
      </div>

      <!-- Different Sizes -->
      <div class="example-section">
        <h3>Different Sizes</h3>
        <div class="size-examples">
          <app-mat-select
            [options]="sizeOptions"
            [config]="smallConfig"
            [(ngModel)]="smallValue"
          ></app-mat-select>
          
          <app-mat-select
            [options]="sizeOptions"
            [config]="mediumConfig"
            [(ngModel)]="mediumValue"
          ></app-mat-select>
          
          <app-mat-select
            [options]="sizeOptions"
            [config]="largeConfig"
            [(ngModel)]="largeValue"
          ></app-mat-select>
        </div>
      </div>

      <!-- Different Appearances -->
      <div class="example-section">
        <h3>Different Appearances</h3>
        <div class="appearance-examples">
          <app-mat-select
            [options]="appearanceOptions"
            [config]="outlineConfig"
            [(ngModel)]="outlineValue"
          ></app-mat-select>
          
          <app-mat-select
            [options]="appearanceOptions"
            [config]="fillConfig"
            [(ngModel)]="fillValue"
          ></app-mat-select>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .example-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .example-section {
      margin-bottom: 30px;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .example-section h3 {
      margin-top: 0;
      color: #333;
    }

    .size-examples,
    .appearance-examples {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    p {
      margin: 8px 0;
      font-size: 14px;
      color: #666;
    }

    button {
      padding: 8px 16px;
      background-color: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  `]
})
export class MatSelectExampleComponent {
  // Form
  exampleForm: FormGroup;

  // Basic select
  basicValue: string = '';
  basicOptions: MatSelectOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
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
    { value: 'vue', label: 'Vue.js' },
    { value: 'svelte', label: 'Svelte' }
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
    { value: 'canada', label: 'Canada', description: 'North America' },
    { value: 'mexico', label: 'Mexico', description: 'North America' },
    { value: 'uk', label: 'United Kingdom', description: 'Europe' },
    { value: 'france', label: 'France', description: 'Europe' },
    { value: 'germany', label: 'Germany', description: 'Europe' },
    { value: 'japan', label: 'Japan', description: 'Asia' },
    { value: 'china', label: 'China', description: 'Asia' }
  ];
  searchableConfig: MatSelectConfig = {
    label: 'Search Countries',
    placeholder: 'Search and select a country',
    searchable: true,
    clearable: true
  };

  // Icon select
  iconValue: string = '';
  iconOptions: MatSelectOption[] = [
    { value: 'home', label: 'Home', icon: 'home', description: 'Go to home page' },
    { value: 'settings', label: 'Settings', icon: 'settings', description: 'Manage your preferences' },
    { value: 'profile', label: 'Profile', icon: 'person', description: 'View your profile' },
    { value: 'help', label: 'Help', icon: 'help', description: 'Get assistance' }
  ];
  iconConfig: MatSelectConfig = {
    label: 'Navigation',
    placeholder: 'Select a page',
    clearable: true
  };

  // Form options
  formOptions: MatSelectOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'mx', label: 'Mexico' }
  ];
  formConfig: MatSelectConfig = {
    label: 'Country',
    placeholder: 'Select your country',
    required: true
  };

  formMultipleOptions: MatSelectOption[] = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' }
  ];
  formMultipleConfig: MatSelectConfig = {
    label: 'Skills',
    placeholder: 'Select your skills',
    multiple: true
  };

  // Size examples
  smallValue: string = '';
  mediumValue: string = '';
  largeValue: string = '';
  sizeOptions: MatSelectOption[] = [
    { value: 's', label: 'Small' },
    { value: 'm', label: 'Medium' },
    { value: 'l', label: 'Large' }
  ];
  smallConfig: MatSelectConfig = { label: 'Small Size', size: 'small' };
  mediumConfig: MatSelectConfig = { label: 'Medium Size', size: 'medium' };
  largeConfig: MatSelectConfig = { label: 'Large Size', size: 'large' };

  // Appearance examples
  outlineValue: string = '';
  fillValue: string = '';
  appearanceOptions: MatSelectOption[] = [
    { value: 'outline', label: 'Outline Style' },
    { value: 'fill', label: 'Fill Style' }
  ];
  outlineConfig: MatSelectConfig = { label: 'Outline Appearance', appearance: 'outline' };
  fillConfig: MatSelectConfig = { label: 'Fill Appearance', appearance: 'fill' };

  constructor(private fb: FormBuilder) {
    this.exampleForm = this.fb.group({
      country: ['', Validators.required],
      skills: [[], Validators.required]
    });
  }

  onBasicSelectionChange(value: string): void {
    console.log('Basic selection changed:', value);
  }

  onMultipleSelectionChange(value: string[]): void {
    console.log('Multiple selection changed:', value);
  }

  onSearchableSelectionChange(value: string): void {
    console.log('Searchable selection changed:', value);
  }

  onSearchChange(searchTerm: string): void {
    console.log('Search term changed:', searchTerm);
  }

  onIconSelectionChange(value: string): void {
    console.log('Icon selection changed:', value);
  }

  onSubmit(): void {
    if (this.exampleForm.valid) {
      console.log('Form submitted:', this.exampleForm.value);
    }
  }
}
