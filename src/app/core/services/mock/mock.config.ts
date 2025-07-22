import { Injectable, InjectionToken } from '@angular/core';
import { environment } from '../../../../environments/environment';

export interface MockConfig {
  delayMin: number;

  delayMax: number;

  errorRate: number;

  autoGenerateActivity: boolean;

  persistToLocalStorage: boolean;

  enableLogging: boolean;

  enabledServices: {
    tasks: boolean;
    users: boolean;
    workspaces: boolean;
    auth: boolean;
  };
}

export const DEFAULT_MOCK_CONFIG: MockConfig = {
  delayMin: 300,
  delayMax: 800,
  errorRate: 0.05,
  autoGenerateActivity: true,
  persistToLocalStorage: true,
  enableLogging: !environment.production,
  enabledServices: {
    tasks: true,
    users: true,
    workspaces: true,
    auth: true,
  },
};

export const MOCK_CONFIG = new InjectionToken<MockConfig>('mock.config');

@Injectable({
  providedIn: 'root',
})
export class MockConfigService {
  private config: MockConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  getConfig(): MockConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<MockConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  isServiceEnabled(serviceName: keyof MockConfig['enabledServices']): boolean {
    return this.config.enabledServices[serviceName];
  }

  getRandomDelay(): number {
    return Math.random() * (this.config.delayMax - this.config.delayMin) + this.config.delayMin;
  }

  shouldSimulateError(): boolean {
    return Math.random() < this.config.errorRate;
  }

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
