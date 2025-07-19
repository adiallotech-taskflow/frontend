# TaskFlow Mock System

A comprehensive mock data system for development and testing with centralized configuration, service management, and developer tools.

## Features

- ✅ **Centralized Configuration** - Control delays, error rates, logging, and persistence
- ✅ **Service Management** - Easy switching between mock and real implementations  
- ✅ **Development Tools** - Reset, seed, export/import capabilities
- ✅ **DevTools Panel** - Visual interface for runtime mock management
- ✅ **CLI Scripts** - npm commands for mock data management

## Quick Setup

### 1. Configure Your App Module

```typescript
import { MockModule, MockUtilsService, MockConfigService, initializeMockDevTools } from '@/core/services';

@NgModule({
  imports: [
    // For development with enhanced logging
    MockModule.forDevelopment(),
    
    // For production (mocks disabled)
    // MockModule.forProduction(),
    
    // Custom configuration
    // MockModule.forRoot({
    //   delayMin: 100,
    //   delayMax: 300,
    //   errorRate: 0.02,
    //   enableLogging: true
    // })
  ]
})
export class AppModule {
  constructor(
    utilsService: MockUtilsService,
    configService: MockConfigService
  ) {
    // Initialize development tools (only in development)
    if (!environment.production) {
      initializeMockDevTools(utilsService, configService);
    }
  }
}
```

### 2. Add DevTools Component (Optional)

```typescript
import { MockDevToolsComponent } from '@/core/services';

@Component({
  template: `
    <router-outlet></router-outlet>
    <app-mock-devtools></app-mock-devtools>
  `,
  imports: [MockDevToolsComponent]
})
export class AppComponent {}
```

## Configuration

### Default Configuration

```typescript
{
  delayMin: 300,           // Minimum API delay (ms)
  delayMax: 800,           // Maximum API delay (ms) 
  errorRate: 0.05,         // 5% error rate
  autoGenerateActivity: true,
  persistToLocalStorage: true,
  enableLogging: true,     // Only in development
  enabledServices: {
    tasks: true,
    users: true, 
    workspaces: true,
    auth: true
  }
}
```

### Runtime Configuration

```typescript
// Inject the config service
constructor(private configService: MockConfigService) {}

// Update configuration
this.configService.updateConfig({
  errorRate: 0.1,  // 10% error rate
  delayMin: 100,
  delayMax: 200
});

// Toggle specific services
this.configService.toggleService('tasks', false);

// Reset to defaults
this.configService.resetConfig();
```

## CLI Commands

```bash
# Reset all mock data
npm run mock:reset

# Seed with demo data (browser only)
npm run mock:seed

# Show help
npm run mock:help
```

## Browser Console Commands

When development tools are initialized, access these commands in the browser console:

```javascript
// Data Management
window.taskflowMock.reset()        // Reset all mock data
window.taskflowMock.seed()         // Load demo data
window.taskflowMock.stats()        // Show data statistics

// Export/Import
window.taskflowMock.export()       // Get data as JSON string
window.taskflowMock.download()     // Download data file
window.taskflowMock.import(json)   // Import JSON data

// Configuration
window.taskflowMock.config()       // Show current config
window.taskflowMock.clearStorage() // Clear all localStorage
```

## Creating New Mock Services

### 1. Extend MockBaseService

```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MockBaseService } from './mock-base.service';
import { User } from '@/core/models';

@Injectable({
  providedIn: 'root'
})
export class UserMockService extends MockBaseService<User> {
  protected override storageKey = 'taskflow_mock_users';
  
  protected override defaultData: User[] = [
    // Default user data
  ];

  getUsers(): Observable<User[]> {
    return this.simulateError<User[]>().pipe(
      switchMap(() => this.getAllFromMockData())
    );
  }
}
```

### 2. Add to MockModule

```typescript
// In mock.module.ts
export class MockModule {
  static forRoot(config?: Partial<MockConfig>) {
    return {
      ngModule: MockModule,
      providers: [
        // ... existing providers
        UserMockService,
        {
          provide: 'UserService',
          useFactory: createMockServiceProvider(
            UserMockService,
            UserService,
            'users'
          )
        }
      ]
    };
  }
}
```

### 3. Update Configuration Interface

```typescript
// In mock.config.ts
export interface MockConfig {
  // ... existing properties
  enabledServices: {
    tasks: boolean;
    users: boolean;
    workspaces: boolean;
    auth: boolean;
    newService: boolean;  // Add new service
  };
}
```

## DevTools Panel

The optional DevTools panel provides a visual interface for:

- **Configuration**: View current settings
- **Service Status**: Enable/disable individual services
- **Data Statistics**: See current data counts and breakdowns
- **Actions**: Reset, seed, export, import, download
- **Error Simulation**: Temporarily trigger errors for testing
- **Console**: View recent mock activity logs

## Best Practices

### Development
- Use `MockModule.forDevelopment()` for enhanced logging and testing
- Enable DevTools panel for visual mock management
- Use higher error rates (10-15%) to test error handling

### Testing
- Use `resetMockData()` before each test suite
- Load specific test data with `loadTestData()`
- Disable persistence for isolated tests

### Production
- Use `MockModule.forProduction()` to disable all mocks
- Never include mock services in production builds
- Remove DevTools component from production

### Performance
- Configure appropriate delay ranges for realistic testing
- Use pagination for large datasets
- Monitor localStorage usage with persistence enabled

## Troubleshooting

### Common Issues

**Mock services not working:**
- Check that MockModule is imported in your app module
- Verify service is enabled in configuration
- Check browser console for error messages

**Data not persisting:**
- Ensure `persistToLocalStorage: true` in configuration
- Check browser localStorage quota
- Verify no localStorage clearing scripts

**DevTools not showing:**
- Confirm you're not in production mode
- Check that `initializeMockDevTools()` is called
- Verify MockDevToolsComponent is imported in your template

**Performance issues:**
- Reduce delay ranges for faster development
- Disable logging for large datasets
- Consider disabling auto-activity generation

### Debug Mode

Enable detailed logging:

```typescript
this.configService.updateConfig({
  enableLogging: true,
  errorRate: 0    // Disable errors during debugging
});
```

## Migration Guide

### From Basic Mocks

1. Replace hardcoded delays with `simulateDelay()`
2. Replace hardcoded error rates with `simulateError()`
3. Use `MockBaseService` as base class
4. Add configuration injection

### From Manual Service Switching

1. Replace manual providers with `MockModule.forRoot()`
2. Use configuration to enable/disable services
3. Remove environment-based conditional logic

## File Structure

```
src/app/core/services/mock/
├── mock.config.ts           # Configuration service & types
├── mock.module.ts           # Module with provider management
├── mock.utils.ts            # Reset/seed utilities & devtools
├── mock-base.service.ts     # Base service with common functionality
├── mock-devtools.component.ts # Optional DevTools UI component
├── task-mock.service.ts     # Example implementation
└── README.md               # This documentation
```