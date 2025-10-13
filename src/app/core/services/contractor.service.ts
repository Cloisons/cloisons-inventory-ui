import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { CommunicationService } from './communication.service';

export interface Contractor {
  _id: string;
  contractorName: string;
  contactPerson?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
}

export interface ContractorsResponse {
  success: boolean;
  data: {
    items: Contractor[];
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ContractorResponse {
  success: boolean;
  data: {
    contractor: Contractor;
  };
}

@Injectable({ providedIn: 'root' })
export class ContractorService {
  private readonly DEFAULT_TIMEOUT = 30000;
  private readonly MAX_RETRIES = 2;

  constructor(private communicationService: CommunicationService) {}

  listContractors(page: number = 1, limit: number = 100, query?: string): Observable<Contractor[]> {
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (query && query.trim() !== '') {
      params['q'] = query.trim();
    }
    return this.communicationService.get<ContractorsResponse>(
      '/contractors',
      'Loading contractors...',
      { params }
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(this.MAX_RETRIES),
      map((resp: any) => {
        // Accept wrapped ({ success, data: { items } }) and unwrapped ({ items })
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to load contractors');
        }
        const payload = isWrapped ? resp.data : resp;
        const items = payload?.items;
        if (!Array.isArray(items)) {
          throw new Error('Invalid contractors response');
        }
        return items as Contractor[];
      }),
      catchError(err => throwError(() => err))
    );
  }

  listContractorsPaged(page: number = 1, limit: number = 10, query?: string): Observable<{ items: Contractor[]; meta?: ContractorsResponse['meta'] }> {
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (query && query.trim() !== '') {
      params['q'] = query.trim();
    }
    return this.communicationService.get<ContractorsResponse>(
      '/contractors',
      'Loading contractors...',
      { params }
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(this.MAX_RETRIES),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to load contractors');
        }
        const payload = isWrapped ? resp.data : resp;
        const items = payload?.items;
        const meta = (isWrapped ? resp.meta : resp?.meta);
        if (!Array.isArray(items)) {
          throw new Error('Invalid contractors response');
        }
        return { items, meta } as { items: Contractor[]; meta?: ContractorsResponse['meta'] };
      }),
      catchError(err => throwError(() => err))
    );
  }

  getContractor(id: string): Observable<Contractor> {
    return this.communicationService.get<ContractorResponse>(
      `/contractors/${id}`,
      'Loading contractor...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(this.MAX_RETRIES),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to load contractor');
        }
        const payload = isWrapped ? resp.data : resp;
        const contractor = payload?.contractor ?? payload;
        if (!contractor || typeof contractor !== 'object') {
          throw new Error('Invalid contractor response');
        }
        return contractor as Contractor;
      }),
      catchError(err => throwError(() => err))
    );
  }

  createContractor(payload: Omit<Contractor, '_id'>): Observable<Contractor> {
    return this.communicationService.post<ContractorResponse>(
      '/contractors',
      payload,
      'Creating contractor...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to create contractor');
        }
        const payload = isWrapped ? resp.data : resp;
        const contractor = payload?.contractor ?? payload;
        if (!contractor || typeof contractor !== 'object') {
          throw new Error('Failed to create contractor');
        }
        return contractor as Contractor;
      }),
      catchError(err => throwError(() => err))
    );
  }

  updateContractor(id: string, payload: Partial<Omit<Contractor, '_id'>>): Observable<Contractor> {
    return this.communicationService.put<ContractorResponse>(
      `/contractors/${id}`,
      payload,
      'Updating contractor...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) {
          throw new Error(resp.message || 'Failed to update contractor');
        }
        const payload = isWrapped ? resp.data : resp;
        const contractor = payload?.contractor ?? payload;
        if (!contractor || typeof contractor !== 'object') {
          throw new Error('Failed to update contractor');
        }
        return contractor as Contractor;
      }),
      catchError(err => throwError(() => err))
    );
  }

  deleteContractor(id: string): Observable<void> {
    return this.communicationService.delete<{ success: boolean }>(
      `/contractors/${id}`,
      'Deleting contractor...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped) {
          if (!resp.success) {
            throw new Error(resp.message || 'Failed to delete contractor');
          }
          return void 0;
        }
        return void 0;
      }),
      catchError(err => throwError(() => err))
    );
  }
}


