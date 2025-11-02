import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { CommunicationService } from './communication.service';

export interface Category {
  _id: string;
  categoryName: string;
  categoryDescription?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  createdBy?: any;
  updatedBy?: any;
}

export interface CategoriesResponse {
  success: boolean;
  data: {
    items: Category[];
  };
  meta?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface CategoryResponse {
  success: boolean;
  data: {
    category: Category;
  };
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly DEFAULT_TIMEOUT = 30000;
  private readonly MAX_RETRIES = 2;

  constructor(private communicationService: CommunicationService) {}

  listCategories(page: number = 1, limit: number = 10, search?: string, parentId?: string, isActive?: boolean): Observable<{ items: Category[]; meta?: CategoriesResponse['meta'] }> {
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (search && search.trim() !== '') {
      params['search'] = search.trim();
    }
    if (parentId !== undefined) {
      params['parentId'] = parentId === 'null' ? 'null' : parentId;
    }
    if (isActive !== undefined) {
      params['isActive'] = String(isActive);
    }
    return this.communicationService.get<CategoriesResponse>(
      '/categories',
      'Loading categories...',
      { params }
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(this.MAX_RETRIES),
      map((resp: any) => {
        // Response interceptor transforms { success: true, data: [...], meta: {...} } 
        // to { items: [...], meta: {...} } for categories API
        const items = Array.isArray(resp?.items) ? resp.items : (Array.isArray(resp) ? resp : []);
        const meta = resp?.meta;
        
        if (!Array.isArray(items)) {
          throw new Error('Invalid categories response - expected array');
        }
        
        return { items, meta } as { items: Category[]; meta?: CategoriesResponse['meta'] };
      }),
      catchError(err => throwError(() => err))
    );
  }

  getCategory(id: string): Observable<Category> {
    return this.communicationService.get<CategoryResponse>(
      `/categories/${id}`,
      'Loading category...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(this.MAX_RETRIES),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to load category');
        }
        const payload = isWrapped ? resp.data : resp;
        // Category is directly in data, not wrapped in category property
        const category = payload?.category ?? payload;
        if (!category || typeof category !== 'object') {
          throw new Error('Invalid category response');
        }
        return category as Category;
      }),
      catchError(err => throwError(() => err))
    );
  }

  createCategory(payload: Omit<Category, '_id'>): Observable<Category> {
    // Always set parentId to null as per requirements
    const categoryPayload = { ...payload, parentId: null };
    return this.communicationService.post<CategoryResponse>(
      '/categories',
      categoryPayload,
      'Creating category...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to create category');
        }
        const payload = isWrapped ? resp.data : resp;
        // Category is directly in data, not wrapped in category property
        const category = payload?.category ?? payload;
        if (!category || typeof category !== 'object') {
          throw new Error('Failed to create category');
        }
        return category as Category;
      }),
      catchError(err => throwError(() => err))
    );
  }

  updateCategory(id: string, payload: Partial<Omit<Category, '_id'>>): Observable<Category> {
    // Always set parentId to null as per requirements
    const categoryPayload = { ...payload, parentId: null };
    return this.communicationService.put<CategoryResponse>(
      `/categories/${id}`,
      categoryPayload,
      'Updating category...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to update category');
        }
        const payload = isWrapped ? resp.data : resp;
        // Category is directly in data, not wrapped in category property
        const category = payload?.category ?? payload;
        if (!category || typeof category !== 'object') {
          throw new Error('Failed to update category');
        }
        return category as Category;
      }),
      catchError(err => throwError(() => err))
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.communicationService.delete<{ success: boolean }>(
      `/categories/${id}`,
      'Deleting category...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped) {
          if (!resp.success) {
            throw new Error(resp.message || 'Failed to delete category');
          }
          return void 0;
        }
        return void 0;
      }),
      catchError(err => throwError(() => err))
    );
  }
}

