import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatTooltipModule,
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
}
