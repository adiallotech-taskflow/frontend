import { Injectable } from '@angular/core';
import { MockConfigService } from './mock.config';
import { TaskMockService } from './task-mock.service';
import { WorkspaceMockService } from './workspace-mock.service';
import { TeamMockService } from './team-mock.service';
import { AuthMockService } from './auth-mock.service';
import { MockDataGenerator } from './mock-data.generator';
import { MockConfig } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class MockUtilsService {
  constructor(
    private configService: MockConfigService,
    private taskMockService: TaskMockService,
    private workspaceMockService: WorkspaceMockService,
    private teamMockService: TeamMockService,
    private authMockService: AuthMockService
  ) {}

  resetAllMockData(): void {
    this.taskMockService.resetMockData();
    this.workspaceMockService.resetMockData();
    this.teamMockService.resetMockData();
    this.authMockService.resetMockData();
  }

  seedWithDemoData(): void {
    // Generate cohesive demo data for all services
    const demoData = MockDataGenerator.generateCohesiveDataset({
      userCount: 15,
      workspaceCount: 5,
      taskCount: 50
    });

    // Load data into each service
    this.authMockService.loadTestData(demoData.users);
    this.workspaceMockService.loadTestData(demoData.workspaces);
    this.taskMockService.loadTestData(demoData.tasks);

    // Teams will use their own demo data generation
    // (teams are not part of the cohesive dataset yet)
    this.teamMockService.resetMockData();

    console.log('[MockUtils] Demo data loaded for all services');
  }

  exportMockData(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      config: this.configService.getConfig(),
      data: {
        tasks: this.taskMockService.getStoredData() || [],
        workspaces: this.workspaceMockService.getStoredData() || [],
        teams: this.teamMockService.getStoredData() || [],
        users: this.authMockService.getStoredData() || []
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

      if (importData.data.workspaces) {
        this.workspaceMockService.loadTestData(importData.data.workspaces);
      }

      if (importData.data.teams) {
        this.teamMockService.loadTestData(importData.data.teams);
      }

      if (importData.data.users) {
        this.authMockService.loadTestData(importData.data.users);
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
      workspaces: {
        total: (this.workspaceMockService.getStoredData() || []).length,
      },
      teams: {
        total: (this.teamMockService.getStoredData() || []).length,
      },
      users: {
        total: (this.authMockService.getStoredData() || []).length,
      }
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
