import { NgModule, ModuleWithProviders, inject } from '@angular/core';
import { MockConfigService, MOCK_CONFIG, DEFAULT_MOCK_CONFIG, MockConfig } from './mock.config';

// Mock Services
import { TaskMockService } from './task-mock.service';
// import { UserMockService } from './user-mock.service';
// import { WorkspaceMockService } from './workspace-mock.service';
// import { AuthMockService } from './auth-mock.service';

// Real Services (to be implemented)
// import { TaskService } from '../task.service';
// import { UserService } from '../user.service';
// import { WorkspaceService } from '../workspace.service';
// import { AuthService } from '../auth.service';

/**
 * Provider factory for conditional service injection
 */
export function createMockServiceProvider<T>(
  mockService: new (...args: any[]) => T,
  realService: new (...args: any[]) => T,
  serviceName: keyof MockConfig['enabledServices']
) {
  return () => {
    const configService = inject(MockConfigService);
    const isMockEnabled = configService.isServiceEnabled(serviceName);
    
    if (isMockEnabled) {
      configService.logAction(`Using mock implementation for ${serviceName}`);
      return inject(mockService);
    } else {
      configService.logAction(`Using real implementation for ${serviceName}`);
      return inject(realService);
    }
  };
}

/**
 * Mock module that provides all mock services and utilities
 */
@NgModule({
  providers: [
    MockConfigService,
    TaskMockService,
    // Add other mock services here as they're created
  ]
})
export class MockModule {
  /**
   * Configure the mock module with custom configuration
   */
  static forRoot(config?: Partial<MockConfig>): ModuleWithProviders<MockModule> {
    return {
      ngModule: MockModule,
      providers: [
        {
          provide: MOCK_CONFIG,
          useValue: { ...DEFAULT_MOCK_CONFIG, ...config }
        },
        MockConfigService,
        TaskMockService,
        
        // Service providers with mock/real switching
        // Uncomment when real services are available
        /*
        {
          provide: 'TaskService',
          useFactory: createMockServiceProvider(
            TaskMockService,
            TaskService,
            'tasks'
          )
        },
        {
          provide: 'UserService',
          useFactory: createMockServiceProvider(
            UserMockService,
            UserService,
            'users'
          )
        },
        {
          provide: 'WorkspaceService',
          useFactory: createMockServiceProvider(
            WorkspaceMockService,
            WorkspaceService,
            'workspaces'
          )
        },
        {
          provide: 'AuthService',
          useFactory: createMockServiceProvider(
            AuthMockService,
            AuthService,
            'auth'
          )
        }
        */
      ]
    };
  }

  /**
   * Configure the mock module for development with enhanced logging
   */
  static forDevelopment(): ModuleWithProviders<MockModule> {
    return MockModule.forRoot({
      enableLogging: true,
      delayMin: 100,
      delayMax: 500,
      errorRate: 0.1, // Higher error rate for testing
      autoGenerateActivity: true
    });
  }

  /**
   * Configure the mock module for production (minimal mocking)
   */
  static forProduction(): ModuleWithProviders<MockModule> {
    return MockModule.forRoot({
      enableLogging: false,
      delayMin: 50,
      delayMax: 200,
      errorRate: 0.01,
      autoGenerateActivity: false,
      enabledServices: {
        tasks: false,
        users: false,
        workspaces: false,
        auth: false
      }
    });
  }

  constructor(private configService: MockConfigService) {
    this.configService.logAction('MockModule initialized');
    this.logCurrentConfig();
  }

  private logCurrentConfig(): void {
    const config = this.configService.getConfig();
    console.log('[Mock] Current configuration:', {
      delays: `${config.delayMin}-${config.delayMax}ms`,
      errorRate: `${(config.errorRate * 100).toFixed(1)}%`,
      enabledServices: Object.entries(config.enabledServices)
        .filter(([_, enabled]) => enabled)
        .map(([service]) => service),
      features: {
        logging: config.enableLogging,
        persistence: config.persistToLocalStorage,
        autoActivity: config.autoGenerateActivity
      }
    });
  }
}