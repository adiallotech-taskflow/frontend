import { Injectable } from '@angular/core';
import { MockConfigService, MockConfig } from './mock.config';
import { TaskMockService } from './task-mock.service';
import { Task } from '../../models';

export interface DemoData {
  tasks: Task[];
}

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

    const jsonData = JSON.stringify(exportData, null, 2);

    return jsonData;
  }

  importMockData(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData);

      if (!importData.data) {
        throw new Error('Invalid data structure: missing data property');
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
    const stats = {
      tasks: {
        total: (this.taskMockService.getStoredData() || []).length,
        byStatus: this.getTaskStatusStats(),
        byPriority: this.getTaskPriorityStats(),
      },
    };

    return stats;
  }

  clearAllStorageData(): void {
    const keys = Object.keys(localStorage).filter(
      (key) => key.startsWith('taskflow_mock_') || key === 'taskflow_mock_config'
    );

    keys.forEach((key) => localStorage.removeItem(key));
  }

  private generateLightDemoData(): DemoData {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const tasks: Task[] = [
      {
        id: 'demo-1',
        title: 'Setup CI/CD Pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment',
        status: 'in-progress',
        priority: 'high',
        assigneeId: 'user1',
        workspaceId: 'ws-1',
        dueDate: tomorrow,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        id: 'demo-2',
        title: 'Implement User Authentication',
        description: 'Add JWT-based authentication with refresh tokens',
        status: 'todo',
        priority: 'high',
        assigneeId: 'user2',
        workspaceId: 'ws-1',
        dueDate: nextWeek,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        id: 'demo-3',
        title: 'Design System Documentation',
        description: 'Create comprehensive documentation for design tokens and components',
        status: 'todo',
        priority: 'medium',
        assigneeId: 'user3',
        workspaceId: 'ws-2',
        dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        id: 'demo-4',
        title: 'API Performance Optimization',
        description: 'Optimize database queries and implement caching strategies',
        status: 'done',
        priority: 'medium',
        assigneeId: 'user1',
        workspaceId: 'ws-1',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'demo-5',
        title: 'Mobile App UI Refresh',
        description: 'Update mobile interface to match new design system',
        status: 'in-progress',
        priority: 'low',
        assigneeId: 'user3',
        workspaceId: 'ws-2',
        dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
    ];

    return {
      tasks,
    };
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
