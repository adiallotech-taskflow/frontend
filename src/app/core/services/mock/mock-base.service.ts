import { Injectable, inject } from '@angular/core';
import { Observable, Subject, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { MockConfigService } from './mock.config';

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MockErrorOptions {
  message?: string;
  code?: string;
  status?: number;
}

@Injectable({
  providedIn: 'root'
})
export abstract class MockBaseService<T> {
  protected storageKey!: string;
  protected defaultData: T[] = [];
  protected updateSubject = new Subject<T[]>();
  protected configService = inject(MockConfigService);

  // Observable pour écouter les changements en temps réel
  public updates$ = this.updateSubject.asObservable();

  constructor() {
    this.initializeStorage();
  }

  /**
   * Initialise le storage avec des données par défaut si nécessaire
   */
  protected initializeStorage(): void {
    const config = this.configService.getConfig();
    if (config.persistToLocalStorage && !this.getStoredData()) {
    console.log('config', JSON.stringify(this.getStoredData()));
      this.saveToStorage(this.defaultData);
      this.configService.logAction(`Initialized ${this.storageKey} with default data`, {
        count: this.defaultData.length
      });
    }
  }

  /**
   * Simule un délai aléatoire basé sur la configuration
   */
  protected simulateDelay(): Observable<void> {
    const delayMs = this.configService.getRandomDelay();
    return of(void 0).pipe(delay(delayMs));
  }

  /**
   * Simule une erreur basée sur la configuration
   */
  protected simulateError<R>(
    customRate?: number,
    options: MockErrorOptions = {}
  ): Observable<R> {
    const errorRate = customRate ?? this.configService.getConfig().errorRate;

    if (this.configService.shouldSimulateError()) {
      const error = {
        message: options.message || 'Mock API Error - This is a simulated error for testing',
        code: options.code || 'MOCK_ERROR',
        status: options.status || 500,
        timestamp: new Date().toISOString()
      };

      this.configService.logAction('Simulated error', { error, rate: errorRate });
      return throwError(() => error);
    }
    return of(null as any);
  }

  /**
   * Génère un ID unique basé sur timestamp et random
   */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Pagine un tableau de résultats
   */
  protected paginateResults<R>(
    items: R[],
    page: number = 1,
    limit: number = 10
  ): PaginationResult<R> {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / limit);

    return {
      items: paginatedItems,
      total: items.length,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  /**
   * Sauvegarde des données dans localStorage
   */
  protected saveToStorage(data: T[]): void {
    const config = this.configService.getConfig();

    if (!config.persistToLocalStorage) {
      this.emitUpdate(data);
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      this.emitUpdate(data);
      this.configService.logAction(`Saved to ${this.storageKey}`, { count: data.length });
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
      this.configService.logAction('Failed to save to localStorage', { error, storageKey: this.storageKey });
    }
  }

  /**
   * Récupère les données depuis localStorage
   */
  public getStoredData(): T[] | null {
    const config = this.configService.getConfig();

    if (!config.persistToLocalStorage) {
      return this.defaultData;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      this.configService.logAction('Failed to load from localStorage', { error, storageKey: this.storageKey });
      return null;
    }
  }

  /**
   * Ajoute un élément aux données mockées
   */
  protected addToMockData(item: T): Observable<T> {
    return this.simulateDelay().pipe(
      map(() => {
        const currentData = this.getStoredData() || [];
        const newItem = { ...item, id: this.generateId() } as T;
        const updatedData = [...currentData, newItem];
        this.saveToStorage(updatedData);
        this.configService.logAction(`Added item to ${this.storageKey}`, { id: (newItem as any).id });
        return newItem;
      })
    );
  }

  /**
   * Met à jour un élément dans les données mockées
   */
  protected updateInMockData(id: string, updates: Partial<T>): Observable<T> {
    return this.simulateDelay().pipe(
      map(() => {
        const currentData = this.getStoredData() || [];
        const index = currentData.findIndex((item: any) => item.id === id);

        if (index === -1) {
          throw new Error(`Item with id ${id} not found`);
        }

        const updatedItem = { ...currentData[index], ...updates } as T;
        currentData[index] = updatedItem;
        this.saveToStorage(currentData);
        this.configService.logAction(`Updated item in ${this.storageKey}`, { id, updates });
        return updatedItem;
      })
    );
  }

  /**
   * Supprime un élément des données mockées
   */
  protected deleteFromMockData(id: string): Observable<boolean> {
    return this.simulateDelay().pipe(
      map(() => {
        const currentData = this.getStoredData() || [];
        const filteredData = currentData.filter((item: any) => item.id !== id);

        if (filteredData.length === currentData.length) {
          throw new Error(`Item with id ${id} not found`);
        }

        this.saveToStorage(filteredData);
        this.configService.logAction(`Deleted item from ${this.storageKey}`, { id });
        return true;
      })
    );
  }

  /**
   * Récupère tous les éléments avec pagination optionnelle
   */
  protected getAllFromMockData(page?: number, limit?: number): Observable<T[] | PaginationResult<T>> {
    return this.simulateDelay().pipe(
      map(() => {
        const data = this.getStoredData() || [];

        if (page && limit) {
          return this.paginateResults(data, page, limit);
        }

        return data;
      })
    );
  }

  /**
   * Récupère un élément par ID
   */
  protected getByIdFromMockData(id: string): Observable<T> {
    return this.simulateDelay().pipe(
      map(() => {
        const data = this.getStoredData() || [];
        const item = data.find((item: any) => item.id === id);

        if (!item) {
          throw new Error(`Item with id ${id} not found`);
        }

        return item;
      })
    );
  }

  /**
   * Recherche dans les données mockées
   */
  protected searchInMockData(
    searchTerm: string,
    searchFields: (keyof T)[],
    page?: number,
    limit?: number
  ): Observable<T[] | PaginationResult<T>> {
    return this.simulateDelay().pipe(
      map(() => {
        const data = this.getStoredData() || [];
        const filteredData = data.filter((item: any) =>
          searchFields.some(field =>
            item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
        );

        if (page && limit) {
          return this.paginateResults(filteredData, page, limit);
        }

        return filteredData;
      })
    );
  }

  /**
   * Remet les données à zéro (utile pour les tests)
   */
  public resetMockData(): void {
    this.saveToStorage(this.defaultData);
    this.configService.logAction(`Reset ${this.storageKey} to default data`, {
      count: this.defaultData.length
    });
  }

  /**
   * Charge des données de test prédéfinies
   */
  public loadTestData(testData: T[]): void {
    this.saveToStorage(testData);
    this.configService.logAction(`Loaded test data to ${this.storageKey}`, {
      count: testData.length
    });
  }

  /**
   * Obtient des statistiques sur les données mockées
   */
  public getMockDataStats(): Observable<{ total: number; lastModified: Date }> {
    return of({
      total: (this.getStoredData() || []).length,
      lastModified: new Date()
    });
  }

  /**
   * Émet une mise à jour aux observateurs
   */
  private emitUpdate(data: T[]): void {
    this.updateSubject.next(data);
  }

  /**
   * Nettoie les ressources (à appeler dans ngOnDestroy)
   */
  public cleanup(): void {
    this.updateSubject.complete();
  }
}
