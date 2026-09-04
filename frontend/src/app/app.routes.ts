import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/auth/login').then((m) => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./pages/auth/register').then((m) => m.RegisterPage) },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', loadComponent: () => import('./pages/home/home').then((m) => m.HomePage) },
      {
        path: 'goods/:id',
        loadComponent: () => import('./pages/goods-detail/goods-detail').then((m) => m.GoodsDetailPage),
      },
      {
        path: 'publish',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/publish/publish').then((m) => m.PublishPage),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/profile/profile').then((m) => m.ProfilePage),
      },
      {
        path: 'favorite',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/favorite/favorite').then((m) => m.FavoritePage),
      },
      {
        path: 'order',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/order/order').then((m) => m.OrderPage),
      },
      {
        path: 'chat',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/chat/chat').then((m) => m.ChatPage),
      },
      {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        loadComponent: () => import('./pages/admin/admin').then((m) => m.AdminPage),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
