import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs';
import { imageUrl, orderStatusColor, orderStatusText } from '../../core/api';
import { Order, PageResult } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';

const PAGE_SIZE = 10;

type RoleTab = 'all' | 'buyer' | 'seller';

@Component({
  selector: 'app-order',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    RouterLink,
  ],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class OrderPage implements OnInit {
  private orderService = inject(OrderService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly result = signal<PageResult<Order> | null>(null);
  readonly records = signal<Order[]>([]);
  readonly tabIndex = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = PAGE_SIZE;

  readonly img = imageUrl;
  readonly orderStatusText = orderStatusText;
  readonly orderStatusColor = orderStatusColor;

  ngOnInit(): void {
    this.load();
  }

  onTabChange(index: number): void {
    this.tabIndex.set(index);
    this.pageIndex.set(0);
    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.load();
  }

  confirm(order: Order): void {
    this.orderService
      .confirm(order.id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.snackBar.open('交易完成', '知道了', { duration: 2000 });
          this.load();
        },
        error: (err: HttpErrorResponse) => this.snackBar.open(err.error?.detail ?? '操作失败', '知道了', { duration: 2500 }),
      });
  }

  cancel(order: Order): void {
    this.orderService
      .cancel(order.id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.snackBar.open('订单已取消，商品重新上架', '知道了', { duration: 2500 });
          this.load();
        },
        error: (err: HttpErrorResponse) => this.snackBar.open(err.error?.detail ?? '操作失败', '知道了', { duration: 2500 }),
      });
  }

  get myUserId(): number {
    return this.auth.currentUser()?.id ?? 0;
  }

  private load(): void {
    const role: RoleTab = (['all', 'buyer', 'seller'] as const)[this.tabIndex()];
    this.loading.set(true);
    this.orderService
      .my(this.pageIndex() + 1, this.pageSize, role)
      .pipe(take(1))
      .subscribe((res) => {
        this.result.set(res);
        this.records.set(res.records);
        this.loading.set(false);
      });
  }
}
