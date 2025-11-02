import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { MatInputComponent } from '../../shared/components/mat-input/mat-input.component';
import { MatButtonComponent } from '../../shared/components/mat-button/mat-button.component';

@Component({
  selector: 'app-edit-category',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatInputComponent, MatButtonComponent],
  templateUrl: './edit-category.component.html',
  styleUrls: ['./edit-category.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditCategoryComponent implements OnInit {
  form: FormGroup;
  submitting = false;
  categoryId = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private router: Router
  ) {
    this.form = this.fb.group({
      categoryName: ['', [Validators.required, Validators.maxLength(100)]],
      categoryDescription: ['', [Validators.maxLength(500)]],
      sortOrder: [0, [Validators.min(0), Validators.max(1000000)]],
      isActive: [true]
    });

    this.categoryId = this.route.snapshot.paramMap.get('id') || '';
    if (this.categoryId) {
      this.load();
    }
  }

  ngOnInit(): void {
    // Component initialization
  }

  load(): void {
    this.categoryService.getCategory(this.categoryId).subscribe({
      next: (c) => {
        this.form.patchValue({
          categoryName: c.categoryName,
          categoryDescription: c.categoryDescription || '',
          sortOrder: c.sortOrder || 0,
          isActive: c.isActive !== undefined ? c.isActive : true
        });
      },
      error: (err) => {
        console.error('Failed to load category:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.submitting || this.form.invalid) return;
    this.submitting = true;

    const payload = this.form.value;
    // parentId will always be null (handled in service)
    this.categoryService.updateCategory(this.categoryId, payload).subscribe({
      next: () => this.router.navigate(['/categories']),
      error: () => (this.submitting = false),
    });
  }

  // Getter methods for form controls
  get categoryNameControl() {
    return this.form.get('categoryName') as FormControl;
  }

  get categoryDescriptionControl() {
    return this.form.get('categoryDescription') as FormControl;
  }

  get sortOrderControl() {
    return this.form.get('sortOrder') as FormControl;
  }

  get isActiveControl() {
    return this.form.get('isActive') as FormControl;
  }
}

