import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/home' },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register').then((m) => m.RegisterPage),
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then((m) => m.HomePage),
      },
      {
        path: 'publish',
        loadComponent: () => import('./pages/publish/publish').then((m) => m.PublishPage),
      },
      {
        path: 'goods/:id',
        loadComponent: () => import('./pages/goods-detail/goods-detail').then((m) => m.GoodsDetailPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile').then((m) => m.ProfilePage),
      },
      {
        path: 'favorite',
        loadComponent: () => import('./pages/favorite/favorite').then((m) => m.FavoritePage),
      },
      {
        path: 'order',
        loadComponent: () => import('./pages/order/order').then((m) => m.OrderPage),
      },
      {
        path: 'chat',
        loadComponent: () => import('./pages/chat/chat').then((m) => m.ChatPage),
      },
      {
        path: 'admin',
        loadComponent: () => import('./pages/admin/admin').then((m) => m.AdminPage),
      },
    ],
  },
];
