# Mat Textarea Component

A reusable Angular Material-style textarea component with floating labels, validation, and character counting.

## Features

- ✅ Floating label animation
- ✅ Form control integration (ControlValueAccessor)
- ✅ Character count with limit
- ✅ Error message display
- ✅ Hint text support
- ✅ Required field indicator
- ✅ Disabled state support
- ✅ Customizable rows and resize behavior
- ✅ Material Design styling
- ✅ Accessibility support

## Usage

### Basic Usage

```html
<app-mat-textarea
  label="Leave a comment"
  placeholder="Ex. It makes me feel..."
  [rows]="3">
</app-mat-textarea>
```

### With Form Control

```html
<app-mat-textarea
  label="Project Description"
  placeholder="Enter project description..."
  formControlName="projectDescription"
  [required]="true"
  [rows]="4">
</app-mat-textarea>
```

### With Character Limit

```html
<app-mat-textarea
  label="Comments"
  placeholder="Enter your comments..."
  [maxLength]="500"
  [rows]="3"
  hint="Maximum 500 characters">
</app-mat-textarea>
```

### With Error Handling

```html
<app-mat-textarea
  label="Description"
  placeholder="Enter description..."
  [errorMessage]="descriptionError"
  [required]="true"
  [rows]="3">
</app-mat-textarea>
```

## Input Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | '' | Label text for the textarea |
| `placeholder` | string | '' | Placeholder text |
| `required` | boolean | false | Whether the field is required |
| `disabled` | boolean | false | Whether the textarea is disabled |
| `errorMessage` | string | '' | Error message to display |
| `hint` | string | '' | Hint text to display |
| `showLabel` | boolean | true | Whether to show the label |
| `rows` | number | 3 | Number of visible text lines |
| `maxLength` | number | 0 | Maximum character limit (0 = no limit) |
| `minLength` | number | 0 | Minimum character limit (0 = no limit) |
| `resize` | 'none' \| 'both' \| 'horizontal' \| 'vertical' | 'vertical' | Resize behavior |

## Output Events

| Event | Type | Description |
|-------|------|-------------|
| `textareaChange` | EventEmitter<string> | Emitted when the textarea value changes |
| `textareaFocus` | EventEmitter<void> | Emitted when the textarea gains focus |
| `textareaBlur` | EventEmitter<void> | Emitted when the textarea loses focus |

## Example: Replacing Existing Textarea

### Before (Bootstrap textarea):
```html
<div class="form-group">
  <label for="projectDescription">Description</label>
  <textarea id="projectDescription" class="form-control" rows="3" formControlName="projectDescription"></textarea>
</div>
```

### After (Mat Textarea):
```html
<app-mat-textarea
  label="Description"
  placeholder="Enter project description..."
  formControlName="projectDescription"
  [rows]="3">
</app-mat-textarea>
```

## Import in Component

```typescript
import { MatTextareaComponent } from './shared/components/mat-textarea/mat-textarea.component';

@Component({
  // ...
  imports: [
    // ... other imports
    MatTextareaComponent
  ]
})
export class YourComponent {
  // ...
}
```

## Styling

The component uses Material Design principles with:
- Floating label animation
- Focus states with color transitions
- Error states with red highlighting
- Disabled states with grayed out appearance
- Character count display
- Custom scrollbar styling
- Responsive design
- High contrast mode support
