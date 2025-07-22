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
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000/api';
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.makeRequest<T>('GET', endpoint, null, options);
  }

  post<T>(endpoint: string, data?: any, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.makeRequest<T>('POST', endpoint, data, options);
  }

  put<T>(endpoint: string, data?: any, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.makeRequest<T>('PUT', endpoint, data, options);
  }

  delete<T>(endpoint: string, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.makeRequest<T>('DELETE', endpoint, null, options);
  }

  patch<T>(endpoint: string, data?: any, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.makeRequest<T>('PATCH', endpoint, data, options);
  }

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
      map((response) => this.transformResponse<T>(response)),
      retryWhen((errors) => this.retryStrategy(errors)),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  private buildHeaders(customHeaders?: HttpHeaders): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    if (customHeaders) {
      customHeaders.keys().forEach((key) => {
        headers = headers.set(key, customHeaders.get(key) || '');
      });
    }

    return headers;
  }

  private transformResponse<T>(response: any): T {
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data;
    }

    return response;
  }

  private retryStrategy(errors: Observable<any>): Observable<any> {
    return errors.pipe(
      mergeMap((error, index) => {
        const retryAttempt = index + 1;
        const maxRetries = 3;
        const retryDelay = 1000 * retryAttempt;

        if (retryAttempt <= maxRetries && this.shouldRetry(error)) {
          console.warn(`Retry attempt ${retryAttempt}/${maxRetries} after ${retryDelay}ms`, error);
          return timer(retryDelay);
        }

        return throwError(() => error);
      })
    );
  }

  private shouldRetry(error: HttpErrorResponse): boolean {
    return !error.status || error.status === 0 || (error.status >= 500 && error.status < 600);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: ApiError;

    if (error.error instanceof ErrorEvent) {
      apiError = {
        message: 'Network error occurred. Please check your connection.',
        code: 'NETWORK_ERROR',
        details: error.error.message,
      };
    } else {
      apiError = {
        message: error.error?.message || `Server error: ${error.status}`,
        code: error.error?.code || `HTTP_${error.status}`,
        details: error.error,
      };

      console.error('API Error:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error.error,
      });
    }

    return throwError(() => apiError);
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
