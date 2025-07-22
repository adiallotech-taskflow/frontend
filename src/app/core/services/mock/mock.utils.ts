import { Injectable } from '@angular/core';
import { MockConfigService, MockConfig } from './mock.config';
import { TaskMockService } from './task-mock.service';

@Injectable({
  providedIn: 'root',
})
export class MockUtilsService {
  constructor(
    private configService: MockConfigService,
    private taskMockService: TaskMockService
  ) {}

  resetAllMockData(): void {
    this.taskMockService.resetMockData();
  }

  seedWithDemoData(): void {
    this.taskMockService.loadRealisticDemoData();
  }

  exportMockData(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      config: this.configService.getConfig(),
      data: {
        tasks: this.taskMockService.getStoredData() || [],
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  importMockData(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData);

      if (!importData.data) {
        console.warn('Invalid data structure: missing data property');
      }

      if (importData.data.tasks) {
        this.taskMockService.loadTestData(importData.data.tasks);
      }

      if (importData.config) {
        this.configService.updateConfig(importData.config);
      }

      return true;
    } catch (error) {
      console.error('[Mock] Import failed:', error);
      return false;
    }
  }

  downloadMockData(filename: string = 'taskflow-mock-data.json'): void {
    const jsonData = this.exportMockData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getMockDataStats(): Record<string, unknown> {
    return {
      tasks: {
        total: (this.taskMockService.getStoredData() || []).length,
        byStatus: this.getTaskStatusStats(),
        byPriority: this.getTaskPriorityStats(),
      },
    };
  }

  clearAllStorageData(): void {
    const keys = Object.keys(localStorage).filter(
      (key) => key.startsWith('taskflow_mock_') || key === 'taskflow_mock_config'
    );

    keys.forEach((key) => localStorage.removeItem(key));
  }

  private getTaskStatusStats(): Record<string, number> {
    const tasks = this.taskMockService.getStoredData() || [];
    return tasks.reduce(
      (stats, task) => {
        stats[task.status] = (stats[task.status] || 0) + 1;
        return stats;
      },
      {} as Record<string, number>
    );
  }

  private getTaskPriorityStats(): Record<string, number> {
    const tasks = this.taskMockService.getStoredData() || [];
    return tasks.reduce(
      (stats, task) => {
        stats[task.priority] = (stats[task.priority] || 0) + 1;
        return stats;
      },
      {} as Record<string, number>
    );
  }
}

declare global {
  interface Window {
    taskflowMock: {
      reset: () => void;
      seed: () => void;
      export: () => string;
      import: (data: string) => boolean;
      download: (filename?: string) => void;
      stats: () => Record<string, unknown>;
      config: () => MockConfig;
      clearStorage: () => void;
    };
  }
}

export function initializeMockDevTools(utilsService: MockUtilsService, configService: MockConfigService): void {
  if (typeof window !== 'undefined' && !window.taskflowMock) {
    window.taskflowMock = {
      reset: () => utilsService.resetAllMockData(),
      seed: () => utilsService.seedWithDemoData(),
      export: () => utilsService.exportMockData(),
      import: (data: string) => utilsService.importMockData(data),
      download: (filename?: string) => utilsService.downloadMockData(filename),
      stats: () => utilsService.getMockDataStats(),
      config: () => configService.getConfig() as unknown as MockConfig,
      clearStorage: () => utilsService.clearAllStorageData(),
    };
  }
}
