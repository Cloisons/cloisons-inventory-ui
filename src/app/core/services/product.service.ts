import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { CommunicationService } from './communication.service';

export interface ProductItemComponent {
  itemId: string;
  quantity: number;
  listedItem?: boolean;
}

export interface Product {
  _id: string;
  productName: string;
  productImage?: string | null;
  productDescription?: string | null;
  items: ProductItemComponent[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductsPagedResponse {
  success: boolean;
  data: {
    products: Product[];
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductResponse {
  success: boolean;
  data: {
    product: Product;
  };
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly DEFAULT_TIMEOUT = 30000;
  private readonly MAX_RETRIES = 2;

  constructor(private communicationService: CommunicationService) {}

  listProductsPaged(page: number = 1, limit: number = 10, query?: string): Observable<{ items: Product[]; meta?: ProductsPagedResponse['meta'] }> {
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (query && query.trim() !== '') params['q'] = query.trim();

    return this.communicationService.get<ProductsPagedResponse>(
      '/products',
      'Loading products...',
      { params }
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(this.MAX_RETRIES),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to load products');
        }
        const payload = isWrapped ? resp.data : resp;
        const items = payload?.products ?? payload?.items;
        const meta = (isWrapped ? resp.meta : resp?.meta);
        if (!Array.isArray(items)) {
          throw new Error('Invalid products response');
        }
        return { items, meta } as { items: Product[]; meta?: ProductsPagedResponse['meta'] };
      }),
      catchError(err => throwError(() => err))
    );
  }

  getProduct(id: string): Observable<Product> {
    return this.communicationService.get<ProductResponse>(
      `/products/${id}`,
      'Loading product...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(this.MAX_RETRIES),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to load product');
        }
        const payload = isWrapped ? resp.data : resp;
        const product = payload?.product ?? payload;
        if (!product || typeof product !== 'object') {
          throw new Error('Invalid product response');
        }
        return product as Product;
      }),
      catchError(err => throwError(() => err))
    );
  }

  createProduct(payload: { productName: string; productImage?: string | null; productDescription?: string | null; items?: ProductItemComponent[] }): Observable<Product> {
    return this.communicationService.post<ProductResponse>(
      '/products',
      payload,
      'Creating product...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to create product');
        }
        const payload = isWrapped ? resp.data : resp;
        const product = payload?.product ?? payload;
        if (!product || typeof product !== 'object') {
          throw new Error('Failed to create product');
        }
        return product as Product;
      }),
      catchError(err => throwError(() => err))
    );
  }

  updateProduct(id: string, payload: Partial<{ productName: string; productImage: string | null; productDescription: string | null; items: ProductItemComponent[] }>): Observable<Product> {
    return this.communicationService.put<ProductResponse>(
      `/products/${id}`,
      payload,
      'Updating product...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to update product');
        }
        const payload = isWrapped ? resp.data : resp;
        const product = payload?.product ?? payload;
        if (!product || typeof product !== 'object') {
          throw new Error('Failed to update product');
        }
        return product as Product;
      }),
      catchError(err => throwError(() => err))
    );
  }

  deleteProduct(id: string): Observable<void> {
    return this.communicationService.delete<{ success: boolean }>(
      `/products/${id}`,
      'Deleting product...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped) {
          if (!resp.success) {
            throw new Error(resp.message || 'Failed to delete product');
          }
          return void 0;
        }
        return void 0;
      }),
      catchError(err => throwError(() => err))
    );
  }
}


