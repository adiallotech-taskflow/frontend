import { Injectable } from '@angular/core';
import { MockConfigService } from './mock.config';
import { TaskMockService } from './task-mock.service';
import { Task } from '../../models';
import { MockDataGenerator } from './mock-data.generator';

/**
 * Demo data for seeding mock services
 */
export interface DemoData {
  tasks: Task[];
  // users: User[];
  // workspaces: Workspace[];
}

/**
 * Utility service for managing mock data across all services
 */
@Injectable({
  providedIn: 'root'
})
export class MockUtilsService {
  constructor(
    private configService: MockConfigService,
    private taskMockService: TaskMockService
  ) {}

  /**
   * Reset all mock data to empty state
   */
  resetAllMockData(): void {
    this.configService.logAction('Resetting all mock data');
    
    // Reset individual services
    this.taskMockService.resetMockData();
    // Add other services here
    
    this.configService.logAction('All mock data reset complete');
  }

  /**
   * Seed all services with realistic demo data
   */
  seedWithDemoData(): void {
    this.configService.logAction('Seeding with realistic demo data');
    
    // Use the new generator for realistic data
    this.taskMockService.loadRealisticDemoData();
    // Add other services here
    
    this.configService.logAction('Realistic demo data seeding complete');
  }

  /**
   * Seed with lightweight demo data
   */
  seedWithLightDemoData(): void {
    this.configService.logAction('Seeding with lightweight demo data');
    
    const demoData = this.generateLightDemoData();
    
    // Seed individual services
    this.taskMockService.loadTestData(demoData.tasks);
    // Add other services here
    
    this.configService.logAction('Light demo data seeding complete', {
      tasks: demoData.tasks.length
    });
  }

  /**
   * Export all mock data as JSON
   */
  exportMockData(): string {
    this.configService.logAction('Exporting mock data');
    
    const exportData = {
      timestamp: new Date().toISOString(),
      config: this.configService.getConfig(),
      data: {
        tasks: this.taskMockService.getStoredData() || []
        // Add other services data here
      }
    };
    
    const jsonData = JSON.stringify(exportData, null, 2);
    this.configService.logAction('Mock data exported', { size: jsonData.length });
    
    return jsonData;
  }

  /**
   * Import mock data from JSON string
   */
  importMockData(jsonData: string): boolean {
    try {
      this.configService.logAction('Importing mock data');
      
      const importData = JSON.parse(jsonData);
      
      // Validate structure
      if (!importData.data) {
        throw new Error('Invalid data structure: missing data property');
      }
      
      // Import to individual services
      if (importData.data.tasks) {
        this.taskMockService.loadTestData(importData.data.tasks);
      }
      // Add other services here
      
      // Optionally restore config
      if (importData.config) {
        this.configService.updateConfig(importData.config);
      }
      
      this.configService.logAction('Mock data import complete', {
        tasks: importData.data.tasks?.length || 0
      });
      
      return true;
    } catch (error) {
      this.configService.logAction('Mock data import failed', error);
      console.error('[Mock] Import failed:', error);
      return false;
    }
  }

  /**
   * Download mock data as a file
   */
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
    
    this.configService.logAction('Mock data downloaded', { filename });
  }

  /**
   * Get statistics about current mock data
   */
  getMockDataStats(): any {
    const stats = {
      tasks: {
        total: (this.taskMockService.getStoredData() || []).length,
        byStatus: this.getTaskStatusStats(),
        byPriority: this.getTaskPriorityStats()
      }
      // Add other service stats here
    };
    
    this.configService.logAction('Mock data stats generated', stats);
    return stats;
  }

  /**
   * Clear all localStorage data for mock services
   */
  clearAllStorageData(): void {
    this.configService.logAction('Clearing all localStorage data');
    
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('taskflow_mock_') || key === 'taskflow_mock_config'
    );
    
    keys.forEach(key => localStorage.removeItem(key));
    
    this.configService.logAction('Storage data cleared', { clearedKeys: keys });
  }

  /**
   * Generate lightweight demo data (using old format for backward compatibility)
   */
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
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
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
        updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
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
        updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
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
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
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
        updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
      }
    ];

    return {
      tasks
    };
  }

  /**
   * Get task statistics by status
   */
  private getTaskStatusStats(): Record<string, number> {
    const tasks = this.taskMockService.getStoredData() || [];
    return tasks.reduce((stats, task) => {
      stats[task.status] = (stats[task.status] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
  }

  /**
   * Get task statistics by priority
   */
  private getTaskPriorityStats(): Record<string, number> {
    const tasks = this.taskMockService.getStoredData() || [];
    return tasks.reduce((stats, task) => {
      stats[task.priority] = (stats[task.priority] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
  }
}

/**
 * Global functions for console access in development
 */
declare global {
  interface Window {
    taskflowMock: {
      reset: () => void;
      seed: () => void;
      export: () => string;
      import: (data: string) => boolean;
      download: (filename?: string) => void;
      stats: () => any;
      config: () => any;
      clearStorage: () => void;
    };
  }
}

/**
 * Initialize global mock utilities for development
 */
export function initializeMockDevTools(utilsService: MockUtilsService, configService: MockConfigService): void {
  if (typeof window !== 'undefined' && !window.taskflowMock) {
    window.taskflowMock = {
      reset: () => utilsService.resetAllMockData(),
      seed: () => utilsService.seedWithDemoData(),
      export: () => utilsService.exportMockData(),
      import: (data: string) => utilsService.importMockData(data),
      download: (filename?: string) => utilsService.downloadMockData(filename),
      stats: () => utilsService.getMockDataStats(),
      config: () => configService.getConfig(),
      clearStorage: () => utilsService.clearAllStorageData()
    };

    console.log('[Mock] DevTools available at window.taskflowMock');
    console.log('Available commands:', Object.keys(window.taskflowMock));
  }
}