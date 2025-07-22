import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { MockConfigService, MockUtilsService, initializeMockDevTools } from './core/services';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    MockConfigService,
    MockUtilsService,
    {
      provide: 'MOCK_DEVTOOLS_INIT',
      useFactory: (utilsService: MockUtilsService, configService: MockConfigService) => {
        if (!environment.production) {
          initializeMockDevTools(utilsService, configService);
        }
        return true;
      },
      deps: [MockUtilsService, MockConfigService]
    }
  ]
};