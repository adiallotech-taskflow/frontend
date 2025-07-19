import { Injectable, InjectionToken } from '@angular/core';
import { environment } from '../../../../environments/environment';

/**
 * Configuration interface for mock services
 */
export interface MockConfig {
  /** Minimum delay in milliseconds for simulated API calls */
  delayMin: number;
  /** Maximum delay in milliseconds for simulated API calls */
  delayMax: number;
  /** Error rate percentage (0-1) for simulating network errors */
  errorRate: number;
  /** Whether to automatically generate activity logs */
  autoGenerateActivity: boolean;
  /** Whether to persist mock data to localStorage */
  persistToLocalStorage: boolean;
  /** Whether to log mock actions in development */
  enableLogging: boolean;
  /** Services that should use mock implementation */
  enabledServices: {
    tasks: boolean;
    users: boolean;
    workspaces: boolean;
    auth: boolean;
  };
}

/**
 * Default mock configuration
 */
export const DEFAULT_MOCK_CONFIG: MockConfig = {
  delayMin: 300,
  delayMax: 800,
  errorRate: 0.05, // 5% error rate
  autoGenerateActivity: true,
  persistToLocalStorage: true,
  enableLogging: !environment.production,
  enabledServices: {
    tasks: true,
    users: true,
    workspaces: true,
    auth: true
  }
};

/**
 * Injection token for mock configuration
 */
export const MOCK_CONFIG = new InjectionToken<MockConfig>('mock.config');

/**
 * Service for managing mock configuration
 */
@Injectable({
  providedIn: 'root'
})
export class MockConfigService {
  private config: MockConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Get current mock configuration
   */
  getConfig(): MockConfig {
    return { ...this.config };
  }

  /**
   * Update mock configuration
   */
  updateConfig(updates: Partial<MockConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    this.logAction('Configuration updated', updates);
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.config = { ...DEFAULT_MOCK_CONFIG };
    this.saveConfig();
    this.logAction('Configuration reset to defaults');
  }

  /**
   * Check if a specific service should use mock implementation
   */
  isServiceEnabled(serviceName: keyof MockConfig['enabledServices']): boolean {
    return this.config.enabledServices[serviceName];
  }

  /**
   * Enable/disable a specific mock service
   */
  toggleService(serviceName: keyof MockConfig['enabledServices'], enabled: boolean): void {
    this.config.enabledServices[serviceName] = enabled;
    this.saveConfig();
    this.logAction(`Service ${serviceName} ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get random delay within configured range
   */
  getRandomDelay(): number {
    return Math.random() * (this.config.delayMax - this.config.delayMin) + this.config.delayMin;
  }

  /**
   * Check if should simulate error based on error rate
   */
  shouldSimulateError(): boolean {
    return Math.random() < this.config.errorRate;
  }

  /**
   * Log mock action if logging is enabled
   */
  logAction(action: string, data?: any): void {
    if (this.config.enableLogging) {
      const timestamp = new Date().toISOString();
      console.log(`[Mock] ${timestamp} - ${action}`, data || '');
    }
  }

  /**
   * Load configuration from localStorage or use defaults
   */
  private loadConfig(): MockConfig {
    if (!DEFAULT_MOCK_CONFIG.persistToLocalStorage) {
      return { ...DEFAULT_MOCK_CONFIG };
    }

    try {
      const stored = localStorage.getItem('taskflow_mock_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_MOCK_CONFIG, ...parsed };
      }
    } catch (error) {
      console.warn('[Mock] Failed to load config from localStorage:', error);
    }

    return { ...DEFAULT_MOCK_CONFIG };
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    if (!this.config.persistToLocalStorage) {
      return;
    }

    try {
      localStorage.setItem('taskflow_mock_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('[Mock] Failed to save config to localStorage:', error);
    }
  }
}