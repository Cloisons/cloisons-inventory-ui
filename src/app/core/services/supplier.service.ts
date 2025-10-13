import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { CommunicationService } from './communication.service';

export interface Supplier {
  _id: string;
  supplierName: string;
  contactPerson?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  countryOfOrigin?: string;
}

export interface SuppliersResponse {
  success: boolean;
  data: {
    items: Supplier[];
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SupplierResponse {
  success: boolean;
  data: {
    supplier: Supplier;
  };
}

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly DEFAULT_TIMEOUT = 30000;
  private readonly MAX_RETRIES = 2;

  constructor(private communicationService: CommunicationService) {}

  listSuppliers(page: number = 1, limit: number = 100, query?: string): Observable<Supplier[]> {
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (query && query.trim() !== '') {
      params['q'] = query.trim();
    }
    return this.communicationService.get<SuppliersResponse>(
      '/suppliers',
      'Loading suppliers...',
      { params }
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(this.MAX_RETRIES),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to load suppliers');
        }
        const payload = isWrapped ? resp.data : resp;
        const items = payload?.items;
        if (!Array.isArray(items)) {
          throw new Error('Invalid suppliers response');
        }
        return items as Supplier[];
      }),
      catchError(err => throwError(() => err))
    );
  }

  listSuppliersPaged(page: number = 1, limit: number = 10, query?: string): Observable<{ items: Supplier[]; meta?: SuppliersResponse['meta'] }> {
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (query && query.trim() !== '') {
      params['q'] = query.trim();
    }
    return this.communicationService.get<SuppliersResponse>(
      '/suppliers',
      'Loading suppliers...',
      { params }
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(this.MAX_RETRIES),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to load suppliers');
        }
        const payload = isWrapped ? resp.data : resp;
        const items = payload?.items;
        const meta = (isWrapped ? resp.meta : resp?.meta);
        if (!Array.isArray(items)) {
          throw new Error('Invalid suppliers response');
        }
        return { items, meta } as { items: Supplier[]; meta?: SuppliersResponse['meta'] };
      }),
      catchError(err => throwError(() => err))
    );
  }

  getSupplier(id: string): Observable<Supplier> {
    return this.communicationService.get<SupplierResponse>(
      `/suppliers/${id}`,
      'Loading supplier...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(this.MAX_RETRIES),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to load supplier');
        }
        const payload = isWrapped ? resp.data : resp;
        const supplier = payload?.supplier ?? payload;
        if (!supplier || typeof supplier !== 'object') {
          throw new Error('Invalid supplier response');
        }
        return supplier as Supplier;
      }),
      catchError(err => throwError(() => err))
    );
  }

  createSupplier(payload: Omit<Supplier, '_id'>): Observable<Supplier> {
    return this.communicationService.post<SupplierResponse>(
      '/suppliers',
      payload,
      'Creating supplier...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to create supplier');
        }
        const payload = isWrapped ? resp.data : resp;
        const supplier = payload?.supplier ?? payload;
        if (!supplier || typeof supplier !== 'object') {
          throw new Error('Failed to create supplier');
        }
        return supplier as Supplier;
      }),
      catchError(err => throwError(() => err))
    );
  }

  updateSupplier(id: string, payload: Partial<Omit<Supplier, '_id'>>): Observable<Supplier> {
    return this.communicationService.put<SupplierResponse>(
      `/suppliers/${id}`,
      payload,
      'Updating supplier...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to update supplier');
        }
        const payload = isWrapped ? resp.data : resp;
        const supplier = payload?.supplier ?? payload;
        if (!supplier || typeof supplier !== 'object') {
          throw new Error('Failed to update supplier');
        }
        return supplier as Supplier;
      }),
      catchError(err => throwError(() => err))
    );
  }

  deleteSupplier(id: string): Observable<void> {
    return this.communicationService.delete<{ success: boolean }>(
      `/suppliers/${id}`,
      'Deleting supplier...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped) {
          if (!resp.success) {
            throw new Error(resp.message || 'Failed to delete supplier');
          }
          return void 0;
        }
        return void 0;
      }),
      catchError(err => throwError(() => err))
    );
  }
}


