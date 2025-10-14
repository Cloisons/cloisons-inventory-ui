import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { UiLoaderService } from './ui-loader.service';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';

/**
 * A generic service for making HTTP requests with centralized
 * loader management, error handling, and response processing.
 */
@Injectable({
  providedIn: 'root',
})
export class CommunicationService {
  private callStackCount = 0;
  private readonly API_BASE_URL = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private uiLoaderService: UiLoaderService,
    private toastService: ToastService
  ) {
    // Expose service globally for testing (only in development)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      (window as any).communicationService = this;
    }
  }

  /**
   * Performs a GET request.
   * @param apiPath The API endpoint URL.
   * @param loaderText The text to display in the loader.
   * @param options An object containing HTTP options (headers, params, etc.).
   * @returns An Observable of the response body.
   */
  get<T>(
    apiPath: string,
    loaderText: string = '',
    options?: {
      headers?: HttpHeaders | { [header: string]: string | string[] };
      params?: HttpParams | { [param: string]: string | string[] };
      observe?: 'body';
      reportProgress?: boolean;
      responseType?: 'json';
      withCredentials?: boolean;
    }
  ): Observable<T> {
    const fullUrl = this._buildUrl(apiPath);
    const requestObservable = this.http.get<T>(fullUrl, options);
    return this._handleRequest(requestObservable, loaderText);
  }

  /**
   * Performs a POST request.
   * @param apiPath The API endpoint URL.
   * @param data The request body.
   * @param loaderText The text to display in the loader.
   * @param options An object containing HTTP options.
   * @returns An Observable of the response body.
   */
  post<T>(
    apiPath: string,
    data: any,
    loaderText: string = '',
    options?: {
      headers?: HttpHeaders | { [header: string]: string | string[] };
      params?: HttpParams | { [param: string]: string | string[] };
      observe?: 'body';
      reportProgress?: boolean;
      responseType?: 'json';
      withCredentials?: boolean;
    }
  ): Observable<T> {
    const fullUrl = this._buildUrl(apiPath);
    const requestObservable = this.http.post<T>(fullUrl, data, options);
    return this._handleRequest(requestObservable, loaderText);
  }

  /**
   * Performs a PUT request.
   * @param apiPath The API endpoint URL.
   * @param data The request body.
   * @param loaderText The text to display in the loader.
   * @param options An object containing HTTP options.
   * @returns An Observable of the response body.
   */
  put<T>(
    apiPath: string,
    data: any,
    loaderText: string = '',
    options?: {
      headers?: HttpHeaders | { [header: string]: string | string[] };
      params?: HttpParams | { [param: string]: string | string[] };
      observe?: 'body';
      reportProgress?: boolean;
      responseType?: 'json';
      withCredentials?: boolean;
    }
  ): Observable<T> {
    const fullUrl = this._buildUrl(apiPath);
    const requestObservable = this.http.put<T>(fullUrl, data, options);
    return this._handleRequest(requestObservable, loaderText);
  }

  /**
   * Performs a PATCH request.
   * @param apiPath The API endpoint URL.
   * @param data The request body.
   * @param loaderText The text to display in the loader.
   * @param options An object containing HTTP options.
   * @returns An Observable of the response body.
   */
  patch<T>(
    apiPath: string,
    data: any,
    loaderText: string = '',
    options?: {
      headers?: HttpHeaders | { [header: string]: string | string[] };
      params?: HttpParams | { [param: string]: string | string[] };
      observe?: 'body';
      reportProgress?: boolean;
      responseType?: 'json';
      withCredentials?: boolean;
    }
  ): Observable<T> {
    const fullUrl = this._buildUrl(apiPath);
    const requestObservable = this.http.patch<T>(fullUrl, data, options);
    return this._handleRequest(requestObservable, loaderText);
  }

  /**
   * Performs a DELETE request.
   * @param apiPath The API endpoint URL.
   * @param loaderText The text to display in the loader.
   * @param options An object containing HTTP options.
   * @returns An Observable of the response body.
   */
  delete<T>(
    apiPath: string,
    loaderText: string = '',
    options?: {
      headers?: HttpHeaders | { [header: string]: string | string[] };
      params?: HttpParams | { [param: string]: string | string[] };
      observe?: 'body';
      reportProgress?: boolean;
      responseType?: 'json';
      withCredentials?: boolean;
    }
  ): Observable<T> {
    const fullUrl = this._buildUrl(apiPath);
    const requestObservable = this.http.delete<T>(fullUrl, options);
    return this._handleRequest(requestObservable, loaderText);
  }

  // --- Private methods for handling requests ---

  /**
   * Builds the full URL by combining base URL with API path
   * @param apiPath The API endpoint path
   * @returns The complete URL
   */
  private _buildUrl(apiPath: string): string {
    // If the path already includes http, return as is
    if (apiPath.startsWith('http')) {
      return apiPath;
    }
    
    // Remove leading slash if present to avoid double slashes
    const cleanPath = apiPath.startsWith('/') ? apiPath.substring(1) : apiPath;
    return `${this.API_BASE_URL}/${cleanPath}`;
  }

  /**
   * A centralized method to handle a single HTTP request Observable.
   * This method manages the loader, error handling, and response status checks.
   * @param requestObservable The Observable from the HttpClient request.
   * @param loaderText The text for the UI loader.
   * @returns The processed Observable.
   */
  private _handleRequest<T>(
    requestObservable: Observable<T>,
    loaderText: string
  ): Observable<T> {
    const showLoader = !!loaderText;
    let timeoutId: number | null = null;
    
    if (showLoader) {
      this._showLoader(loaderText);
      
      // Safety timeout to ensure loader is hidden even if finalize doesn't execute
      timeoutId = setTimeout(() => {
        this._forceHideLoader();
      }, 30000); // 30 seconds timeout
    }

    return new Observable<T>(subscriber => {
      const subscription = requestObservable.subscribe({
        next: (response: any) => {
          // Check for custom response structure with statusCode
          if (response && typeof response === 'object') {
            const statusCode = response.statusCode || response.status || response.code;
            const message = response.message || response.error || response.errorMessage;
            
            if (statusCode && statusCode !== 200) {
              const errorMessage = message || this._getDefaultErrorMessage(statusCode);
              this.toastService.error(errorMessage || 'Request failed. Please try again.', 'Error');
              this._hideLoaderSafely(showLoader, timeoutId);
              subscriber.error(new Error(errorMessage));
              return;
            }
            
            // Check for success field - if success is false, treat as error
            if (response.success === false) {
              const errorMessage = message || 'Request failed';
              this.toastService.error(errorMessage || 'Request failed. Please try again.', 'Error');
              this._hideLoaderSafely(showLoader, timeoutId);
              subscriber.error(new Error(errorMessage));
              return;
            }
          }
          
          this._hideLoaderSafely(showLoader, timeoutId);
          subscriber.next(response);
          subscriber.complete();
        },
        error: (error) => {
          debugger
          // Handle HTTP errors (4xx, 5xx status codes)
          if (error?.status) {
            let errorMessage = this._getHttpErrorMessage(error);
            
            // If it's an HTTP error with a response body, try to extract the message
            if (error?.error && typeof error.error === 'object') {
              if (!!error?.error?.errors?.details) {
                errorMessage = error.error.errors.details;
              } else {
              if (Array.isArray(error.error?.errors)) {
                errorMessage = error.error.errors.map((error: any) => error.message || error.error || error.errorMessage).join(', ');
              } else {
              const customMessage =  error.error.message || error.error.error || error.error.errorMessage;
                if (customMessage) {
                  errorMessage = customMessage;
                }
              }
            }
            }
            
            this.toastService.error(errorMessage || 'Request failed. Please try again.', 'Error');
          } else if (error?.message) {
            this.toastService.error(error.message || 'Request failed. Please try again.', 'Error');
          } else {
            this.toastService.error('Request failed. Please try again.', 'Error');
          }
          
          this._hideLoaderSafely(showLoader, timeoutId);
          subscriber.error(error);
        }
      });
      
      // Return cleanup function
      return () => {
        subscription.unsubscribe();
        this._hideLoaderSafely(showLoader, timeoutId);
      };
    });
  }

  private _showLoader(loaderText: string): void {
    if (this.callStackCount === 0) {
      this.uiLoaderService.start(loaderText);
    }
    this.callStackCount++;
  }

  private _hideLoader(): void {
    if (this.callStackCount > 0) {
      this.callStackCount--;
    }
    if (this.callStackCount === 0) {
      this.uiLoaderService.stop();
    }
  }

  /**
   * Force hide the loader - useful for error recovery
   * This method resets the call stack and forces the loader to stop
   */
  private _forceHideLoader(): void {
    this.callStackCount = 0;
    this.uiLoaderService.stop();
  }

  /**
   * Safely hide the loader with proper cleanup
   * This method ensures the loader is hidden and timeout is cleared
   */
  private _hideLoaderSafely(showLoader: boolean, timeoutId: number | null): void {
    // Clear the safety timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (showLoader) {
      try {
        this._hideLoader();
      } catch (error) {
        this._forceHideLoader();
      }
    }
  }


  /**
   * Get default error message based on status code
   * @param statusCode The error status code
   * @returns Default error message
   */
  private _getDefaultErrorMessage(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'Bad Request - Please check your input';
      case 401:
        return 'Unauthorized - Please log in again';
      case 403:
        return 'Forbidden - You do not have permission to perform this action';
      case 404:
        return 'Not Found - The requested resource was not found';
      case 422:
        return 'Validation Error - Please check your input data';
      case 429:
        return 'Too Many Requests - Please try again later';
      case 500:
        return 'Internal Server Error - Please try again later';
      case 502:
      case 503:
      case 504:
        return 'Service Unavailable - Please try again later';
      default:
        return `Request failed with status code ${statusCode}`;
    }
  }

  /**
   * Get HTTP error message from error object
   * @param error The HTTP error object
   * @returns Formatted error message
   */
  private _getHttpErrorMessage(error: any): string {
    // Check for custom error message in response body
    if (error?.error && typeof error.error === 'object') {
      // Backend response format: { success: false, message: "Error message" }
      if (error.error.message) {
        return error.error.message;
      } else if (error.error.error) {
        return error.error.error;
      } else if (error.error.errorMessage) {
        return error.error.errorMessage;
      }
    } else if (typeof error?.error === 'string') {
      return error.error;
    } else if (error?.message) {
      return error.message;
    }
    
    // Fallback to default message based on status code
    return this._getDefaultErrorMessage(error?.status || 500);
  }

  /**
   * Test method to verify loader functionality
   * This method can be called from the browser console for testing
   */
  testLoader(): void {
    console.log('Testing loader...');
    this.uiLoaderService.start('Test loader message');
    
    setTimeout(() => {
      console.log('Hiding loader...');
      this.uiLoaderService.stop();
    }, 3000);
  }

}
