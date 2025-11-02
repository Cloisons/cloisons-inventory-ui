import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError, retry, timeout } from 'rxjs/operators';
import { CommunicationService } from './communication.service';

export interface Item {
  _id: string;
  itemCode: string;
  itemName: string;
  itemImage: string;
  itemDescription: string;
  supplierId: {
    _id: string;
    supplierName: string;
    contactPerson: string;
    email: string;
    phoneNumber: string;
    address: string;
    countryOfOrigin: string;
    createdBy: string;
    updatedBy: string;
    isDeleted: boolean;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
    __v: number;
  } | null;
  unitScale: string;
  totalQty: number;
  availableQty: number;
  listedItem: boolean;
  categoryId?: {
    _id: string;
    categoryName: string;
  } | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
  sellingCost: number;
}

export interface ItemsResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    items: Item[];
  };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ItemsRequestParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ItemCreateRequest {
  itemCode?: string;
  itemName: string;
  itemImage?: string;
  itemDescription: string;
  supplierId: string;
  categoryId?: string | null;
  unitScale: string;
  totalQty: number;
  unitCost: number; // required by backend
  listedItem?: boolean;
  sellingCost?: number; // optional, superAdmin only
}

export interface ItemUpdateRequest {
  _id: string;
  itemCode?: string;
  itemName?: string;
  itemImage?: string;
  itemDescription?: string;
  supplierId?: string;
  categoryId?: string | null;
  unitScale?: string;
  listedItem?: boolean;
}

export interface StockAdditionRequest {
  quantity: number;
  unitCost: number;
  sellingCost: number | undefined;
  notes?: string;
}

export interface StockHistoryItem {
  _id: string;
  itemId: string;
  change: number; // positive for additions, negative for deductions
  reason: string | null;
  unitCost: number;
  sellingCost: number | null;
  createdBy: { _id: string; name?: string; email?: string; role?: string };
  updatedBy: { _id: string; name?: string; email?: string; role?: string };
  previousAvailableQty: number;
  newAvailableQty: number;
  createdAt: string;
}

export interface StockHistoryResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    items: StockHistoryItem[];
  };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private readonly DEFAULT_PAGE_SIZE = 10;
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 2;

  constructor(private communicationService: CommunicationService) {}

  getItems(params: ItemsRequestParams = {}): Observable<ItemsResponse> {
    const queryParams: Record<string, string> = {
      page: (params.page || 1).toString(),
      limit: (params.limit || this.DEFAULT_PAGE_SIZE).toString(),
      q: params.search || '',
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc'
    };
    
    // Add categoryId if provided and not "all"
    if (params.categoryId && params.categoryId !== 'all') {
      queryParams['categoryId'] = params.categoryId;
    }

    return this.communicationService.get<ItemsResponse>(
      '/items',
      'Loading items...',
      { params: queryParams }
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(this.MAX_RETRIES),
      map(response => this.validateItemsResponse(response)),
      catchError(error => this.handleError('Failed to load items', error))
    );
  }

  getAllItems(params: ItemsRequestParams = {}): Observable<ItemsResponse> {
    const queryParams: Record<string, string> = {
      page: (params.page || 1).toString(),
      limit: (params.limit || this.DEFAULT_PAGE_SIZE).toString(),
      q: params.search || '',
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc'
    };
    
    // Add categoryId if provided and not "all"
    if (params.categoryId && params.categoryId !== 'all') {
      queryParams['categoryId'] = params.categoryId;
    }

    return this.communicationService.get<ItemsResponse>(
      '/items/all',
      'Loading all items...',
      { params: queryParams }
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(this.MAX_RETRIES),
      map(response => this.validateItemsResponse(response)),
      catchError(error => this.handleError('Failed to load all items', error))
    );
  }

  getItemById(id: string): Observable<{ success: boolean; data: Item }> {
    if (!id || id.trim() === '') {
      return throwError(() => new Error('Item ID is required'));
    }

    return this.communicationService.get<any>(
      `/items/${id}`,
      'Loading item details...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(this.MAX_RETRIES),
      map(response => this.validateItemResponse(response)),
      catchError(error => this.handleError('Failed to load item details', error))
    );
  }

  createItem(itemData: ItemCreateRequest): Observable<{ success: boolean; data: Item }> {
    const validatedData = this.validateItemCreateRequest(itemData);
    
    return this.communicationService.post<{ success: boolean; data: Item }>(
      '/items',
      validatedData,
      'Creating item...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map(response => this.validateItemResponse(response)),
      catchError(error => this.handleError('Failed to create item', error))
    );
  }

  updateItem(id: string, itemData: ItemUpdateRequest): Observable<{ success: boolean; data: Item }> {
    if (!id || id.trim() === '') {
      return throwError(() => new Error('Item ID is required'));
    }

    const validatedData = this.validateItemUpdateRequest(itemData);
    
    return this.communicationService.put<{ success: boolean; data: Item }>(
      `/items/${id}`,
      validatedData,
      'Updating item...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map(response => this.validateItemResponse(response)),
      catchError(error => this.handleError('Failed to update item', error))
    );
  }

  deleteItem(id: string): Observable<{ success: boolean; message: string }> {
    if (!id || id.trim() === '') {
      return throwError(() => new Error('Item ID is required'));
    }

    return this.communicationService.delete<{ success: boolean; message: string }>(
      `/items/${id}`,
      'Deleting item...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map(response => this.validateDeleteResponse(response)),
      catchError(error => this.handleError('Failed to delete item', error))
    );
  }

  addStock(itemId: string, stockData: StockAdditionRequest): Observable<{ success: boolean; data: any }> {
    if (!itemId || itemId.trim() === '') {
      return throwError(() => new Error('Item ID is required'));
    }

    const validatedData = this.validateStockAdditionRequest(stockData);
    
    return this.communicationService.post<{ success: boolean; data: any }>(
      `/items/${itemId}/stock`,
      validatedData,
      'Adding stock...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map(response => this.validateStockAdditionResponse(response)),
      catchError(error => this.handleError('Failed to add stock', error))
    );
  }

  getStockHistory(itemId: string, params: { page?: number; limit?: number } = {}): Observable<StockHistoryResponse> {
    if (!itemId || itemId.trim() === '') {
      return throwError(() => new Error('Item ID is required'));
    }

    const queryParams = {
      page: (params.page || 1).toString(),
      limit: (params.limit || this.DEFAULT_PAGE_SIZE).toString(),
    };

    return this.communicationService.get<StockHistoryResponse>(
      `/items/${itemId}/stock/history`,
      'Loading stock history...',
      { params: queryParams }
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(this.MAX_RETRIES),
      map(response => this.validateStockHistoryResponse(response)),
      catchError(error => this.handleError('Failed to load stock history', error))
    );
  }

  updateSellingCost(stockHistoryId: string, sellingCost: number, reason?: string): Observable<{ success: boolean; data: any }> {
    if (!stockHistoryId || stockHistoryId.trim() === '') {
      return throwError(() => new Error('Stock history ID is required'));
    }

    if (typeof sellingCost !== 'number' || sellingCost < 0) {
      return throwError(() => new Error('Selling cost must be a non-negative number'));
    }

    const requestData: any = { sellingCost };
    if (reason && reason.trim() !== '') {
      requestData.reason = reason.trim();
    }

    return this.communicationService.put<{ success: boolean; data: any }>(
      `/items/stock/${stockHistoryId}/selling-cost`,
      requestData,
      'Updating selling cost...'
    ).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      map(response => this.validateStockAdditionResponse(response)),
      catchError(error => this.handleError('Failed to update selling cost', error))
    );
  }

  // Private validation methods
  private validateItemsResponse(response: any): ItemsResponse {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format');
    }

    // Support both wrapped ({ success, data: { items }, meta }) and unwrapped ({ items, meta })
    const isWrapped = Object.prototype.hasOwnProperty.call(response, 'success');
    if (isWrapped && response.success === false) {
      throw new Error(response.message || 'Request failed');
    }

    const payload = isWrapped ? response.data : response;
    const items = payload?.items;
    const meta = (isWrapped ? response.meta : response.meta);

    if (!Array.isArray(items)) {
      throw new Error('Invalid items data format');
    }

    if (!meta || typeof meta.total !== 'number') {
      throw new Error('Invalid pagination metadata');
    }

    return {
      success: true,
      message: (isWrapped ? response.message : 'Items fetched successfully') || 'OK',
      timestamp: new Date().toISOString(),
      data: { items },
      meta
    } as ItemsResponse;
  }

  private validateItemResponse(response: any): { success: boolean; data: Item } {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format');
    }

    // Support both wrapped and unwrapped
    const isWrapped = Object.prototype.hasOwnProperty.call(response, 'success');
    if (isWrapped && response.success === false) {
      throw new Error(response.message || 'Request failed');
    }

    const payload = isWrapped ? response.data : response;
    const data = (payload && typeof payload === 'object') ? (payload.item ?? payload) : null;

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid item data format');
    }

    return { success: true, data: data as Item };
  }

  private validateDeleteResponse(response: any): { success: boolean; message: string } {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format');
    }

    // Usually wrapped; handle unwrapped defensively
    const isWrapped = Object.prototype.hasOwnProperty.call(response, 'success');
    if (isWrapped) {
      if (!response.success) {
        throw new Error(response.message || 'Delete operation failed');
      }
      return response as { success: boolean; message: string };
    }

    const message = (response.message as string) || 'Delete operation completed';
    return { success: true, message };
  }

  private validateItemCreateRequest(data: ItemCreateRequest): ItemCreateRequest {
    if (!data.itemName || data.itemName.trim() === '') {
      throw new Error('Item name is required');
    }

    if (!data.itemDescription || data.itemDescription.trim() === '') {
      throw new Error('Item description is required');
    }

    if (!data.supplierId || data.supplierId.trim() === '') {
      throw new Error('Supplier is required');
    }

    if (!data.unitScale || data.unitScale.trim() === '') {
      throw new Error('Unit scale is required');
    }

    if (typeof data.totalQty !== 'number' || data.totalQty < 0) {
      throw new Error('Total quantity must be a non-negative number');
    }

    if (typeof data.unitCost !== 'number' || data.unitCost < 0) {
      throw new Error('Unit cost must be a non-negative number');
    }

    if (data.sellingCost !== undefined && (typeof data.sellingCost !== 'number' || data.sellingCost < 0)) {
      throw new Error('Selling cost must be a non-negative number');
    }

    return data;
  }

  private validateItemUpdateRequest(data: ItemUpdateRequest): ItemUpdateRequest {
    if (data.itemName !== undefined && (!data.itemName || data.itemName.trim() === '')) {
      throw new Error('Item name cannot be empty');
    }

    if (data.itemDescription !== undefined && (!data.itemDescription || data.itemDescription.trim() === '')) {
      throw new Error('Item description cannot be empty');
    }

    if (data.unitScale !== undefined && (!data.unitScale || data.unitScale.trim() === '')) {
      throw new Error('Unit scale cannot be empty');
    }

    // Quantity and cost updates are not allowed via item update; use stock endpoints

    return data;
  }

  private validateStockAdditionRequest(data: StockAdditionRequest): StockAdditionRequest {
    if (typeof data.quantity !== 'number' || data.quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }

    if (typeof data.unitCost !== 'number' || data.unitCost < 0) {
      throw new Error('Unit cost must be a non-negative number');
    }

    if (data.sellingCost !== undefined && (typeof data.sellingCost !== 'number' || data.sellingCost < 0)) {
      throw new Error('Selling cost must be a non-negative number');
    }

    if (data.notes !== undefined && typeof data.notes !== 'string') {
      throw new Error('Notes must be a string');
    }

    return data;
  }

  private validateStockAdditionResponse(response: any): { success: boolean; data: any } {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format');
    }

    const isWrapped = Object.prototype.hasOwnProperty.call(response, 'success');
    if (isWrapped && response.success === false) {
      throw new Error(response.message || 'Stock addition failed');
    }

    const payload = isWrapped ? response.data : response;
    return { success: true, data: payload } as { success: boolean; data: any };
  }

  private validateStockHistoryResponse(response: any): StockHistoryResponse {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format');
    }
    const isWrapped = Object.prototype.hasOwnProperty.call(response, 'success');
    if (isWrapped && response.success === false) {
      throw new Error(response.message || 'Request failed');
    }
    const payload = isWrapped ? response : {
      success: true,
      message: 'Stock history fetched successfully',
      timestamp: new Date().toISOString(),
      data: { items: response.items || [] },
      meta: response.meta || { page: 1, limit: (this as any).DEFAULT_PAGE_SIZE, total: 0, totalPages: 0 }
    };
    const items = payload?.data?.items;
    if (!Array.isArray(items)) {
      throw new Error('Invalid stock history data format');
    }
    return payload as StockHistoryResponse;
  }

  private handleError(operation: string, error: any): Observable<never> {
    console.error(`${operation}:`, error);
    
    let errorMessage = `${operation}. `;
    
    if (error.status === 0) {
      errorMessage += 'Network error. Please check your connection.';
    } else if (error.status === 401) {
      errorMessage += 'Authentication required. Please log in again.';
    } else if (error.status === 403) {
      errorMessage += 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      errorMessage += 'Item not found.';
    } else if (error.status >= 500) {
      errorMessage += 'Server error. Please try again later.';
    } else if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += 'An unexpected error occurred.';
    }

    return throwError(() => new Error(errorMessage));
  }
}
