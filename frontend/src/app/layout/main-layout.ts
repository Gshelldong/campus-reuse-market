import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { imageUrl } from '../core/api';
import { AuthService } from '../core/services/auth.service';
import { ChatService } from '../core/services/chat.service';

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NzLayoutModule,
    NzMenuModule,
    NzDropDownModule,
    NzButtonModule,
    NzIconModule,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private chat = inject(ChatService);
  private router = inject(Router);

  readonly currentUser = this.auth.currentUser;
  readonly isAdmin = this.auth.isAdmin;
  readonly unread = signal(0);
  readonly img = imageUrl;

  private pollSub?: Subscription;

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.pollSub = interval(10000)
        .pipe(
          startWith(0),
          switchMap(() => this.chat.unreadCount()),
        )
        .subscribe({
          next: (res) => this.unread.set(res.count),
          error: () => this.unread.set(0),
        });
    }
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  scrollToMarket(): void {
    setTimeout(() => {
      document.querySelector('.goods-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}
