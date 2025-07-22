import { NgModule, ModuleWithProviders, inject } from '@angular/core';
import { MockConfigService, MOCK_CONFIG, DEFAULT_MOCK_CONFIG, MockConfig } from './mock.config';


import { TaskMockService } from './task-mock.service';











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


@NgModule({
  providers: [
    MockConfigService,
    TaskMockService,
    
  ]
})
export class MockModule {
  
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
        
        
        
        
      ]
    };
  }

  
  static forDevelopment(): ModuleWithProviders<MockModule> {
    return MockModule.forRoot({
      enableLogging: true,
      delayMin: 100,
      delayMax: 500,
      errorRate: 0.1, 
      autoGenerateActivity: true
    });
  }

  
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