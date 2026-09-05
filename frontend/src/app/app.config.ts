import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { zh_CN, provideNzI18n } from 'ng-zorro-antd/i18n';

registerLocaleData(zh);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideNzI18n(zh_CN),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
