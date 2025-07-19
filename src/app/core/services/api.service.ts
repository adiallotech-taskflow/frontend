import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, timer } from 'rxjs';
import { catchError, map, finalize, retryWhen, mergeMap } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000/api';
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * GET request
   */
  get<T>(endpoint: string, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.makeRequest<T>('GET', endpoint, null, options);
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, data?: any, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.makeRequest<T>('POST', endpoint, data, options);
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data?: any, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.makeRequest<T>('PUT', endpoint, data, options);
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.makeRequest<T>('DELETE', endpoint, null, options);
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, data?: any, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.makeRequest<T>('PATCH', endpoint, data, options);
  }

  /**
   * Core request method with error handling, loading state, and retry logic
   */
  private makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: { headers?: HttpHeaders }
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(options?.headers);

    this.setLoading(true);

    let request$: Observable<any>;

    switch (method) {
      case 'GET':
        request$ = this.http.get(url, { headers });
        break;
      case 'POST':
        request$ = this.http.post(url, data, { headers });
        break;
      case 'PUT':
        request$ = this.http.put(url, data, { headers });
        break;
      case 'PATCH':
        request$ = this.http.patch(url, data, { headers });
        break;
      case 'DELETE':
        request$ = this.http.delete(url, { headers });
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    return request$.pipe(
      map(response => this.transformResponse<T>(response)),
      retryWhen(errors => this.retryStrategy(errors)),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Build complete URL from endpoint
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  /**
   * Build HTTP headers with default content type
   */
  private buildHeaders(customHeaders?: HttpHeaders): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (customHeaders) {
      customHeaders.keys().forEach(key => {
        headers = headers.set(key, customHeaders.get(key) || '');
      });
    }

    return headers;
  }

  /**
   * Transform API response to extract data
   */
  private transformResponse<T>(response: any): T {
    // If response is wrapped in an ApiResponse structure
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data;
    }

    // Return response as-is if it's already the expected format
    return response;
  }

  /**
   * Retry strategy for network errors
   */
  private retryStrategy(errors: Observable<any>): Observable<any> {
    return errors.pipe(
      mergeMap((error, index) => {
        const retryAttempt = index + 1;
        const maxRetries = 3;
        const retryDelay = 1000 * retryAttempt; // Exponential backoff

        // Only retry on network errors or 5xx server errors
        if (retryAttempt <= maxRetries && this.shouldRetry(error)) {
          console.warn(`Retry attempt ${retryAttempt}/${maxRetries} after ${retryDelay}ms`, error);
          return timer(retryDelay);
        }

        // If max retries exceeded or error shouldn't be retried, throw the error
        return throwError(() => error);
      })
    );
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetry(error: HttpErrorResponse): boolean {
    // Retry on network errors or 5xx server errors
    return !error.status || // Network error (no status)
           error.status === 0 || // Network error
           (error.status >= 500 && error.status < 600); // Server errors
  }

  /**
   * Centralized error handling
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: ApiError;

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      apiError = {
        message: 'Network error occurred. Please check your connection.',
        code: 'NETWORK_ERROR',
        details: error.error.message
      };
    } else {
      // Server-side error
      apiError = {
        message: error.error?.message || `Server error: ${error.status}`,
        code: error.error?.code || `HTTP_${error.status}`,
        details: error.error
      };

      // Log server errors to console
      console.error('API Error:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error.error
      });
    }

    return throwError(() => apiError);
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Get current loading state
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
