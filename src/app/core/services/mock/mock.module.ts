import { NgModule, ModuleWithProviders, inject } from '@angular/core';
import { MockConfigService, MOCK_CONFIG, DEFAULT_MOCK_CONFIG } from './mock.config';

import { TaskMockService } from './task-mock.service';
import {MockConfig} from '../../models';

export function createMockServiceProvider<T>(
  mockService: new (...args: unknown[]) => T,
  realService: new (...args: unknown[]) => T,
  serviceName: keyof MockConfig['enabledServices']
) {
  return () => {
    const configService = inject(MockConfigService);
    const isMockEnabled = configService.isServiceEnabled(serviceName);

    if (isMockEnabled) {
      return inject(mockService);
    } else {
      return inject(realService);
    }
  };
}

@NgModule({
  providers: [MockConfigService, TaskMockService],
})
export class MockModule {
  static forRoot(config?: Partial<MockConfig>): ModuleWithProviders<MockModule> {
    return {
      ngModule: MockModule,
      providers: [
        {
          provide: MOCK_CONFIG,
          useValue: { ...DEFAULT_MOCK_CONFIG, ...config },
        },
        MockConfigService,
        TaskMockService,
      ],
    };
  }

  static forDevelopment(): ModuleWithProviders<MockModule> {
    return MockModule.forRoot({
      enableLogging: true,
      delayMin: 100,
      delayMax: 500,
      errorRate: 0.1,
      autoGenerateActivity: true,
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
        auth: false,
      },
    });
  }
}
