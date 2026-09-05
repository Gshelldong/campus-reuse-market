import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { zh_CN, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  MailOutline,
  PlusOutline,
  DownOutline,
  PhoneOutline,
  EnvironmentOutline,
  UserOutline,
  LogoutOutline,
  SearchOutline,
  CloseCircleOutline,
  CloseOutline,
  LeftOutline,
  RightOutline,
  EllipsisOutline,
  SettingOutline,
  EditOutline,
  DeleteOutline,
  CameraOutline,
  LoadingOutline,
  InboxOutline,
  CloudDownloadOutline,
} from '@ant-design/icons-angular/icons';

registerLocaleData(zh);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideNzI18n(zh_CN),
    provideNzIcons([
      MailOutline,
      PlusOutline,
      DownOutline,
      PhoneOutline,
      EnvironmentOutline,
      UserOutline,
      LogoutOutline,
      SearchOutline,
      CloseCircleOutline,
      CloseOutline,
      LeftOutline,
      RightOutline,
      EllipsisOutline,
      SettingOutline,
      EditOutline,
      DeleteOutline,
      CameraOutline,
      LoadingOutline,
      InboxOutline,
      CloudDownloadOutline,
    ]),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
