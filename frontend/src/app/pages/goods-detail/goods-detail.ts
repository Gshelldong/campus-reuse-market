import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { conditionText, goodsStatusText, imageUrl } from '../../core/api';
import { Category, Goods } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { GoodsService } from '../../core/services/goods.service';
import { OrderService } from '../../core/services/order.service';
import { BuyConfirmDialog } from './buy-confirm-dialog';

@Component({
  selector: 'app-goods-detail',
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './goods-detail.html',
  styleUrl: './goods-detail.css',
})
export class GoodsDetailPage implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private goodsService = inject(GoodsService);
  private favoriteService = inject(FavoriteService);
  private orderService = inject(OrderService);
  private categoryService = inject(CategoryService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  readonly goods = signal<Goods | null>(null);
  readonly loading = signal(true);
  readonly favorited = signal(false);
  readonly currentImageIndex = signal(0);
  readonly categoryName = signal('');

  readonly img = imageUrl;
  readonly conditionText = conditionText;
  readonly goodsStatusText = goodsStatusText;
  readonly isLoggedIn = this.auth.isLoggedIn;

  readonly images = computed(() => this.goods()?.images ?? []);
  readonly currentImage = computed(() => {
    const list = this.images();
    return list.length ? imageUrl(list[this.currentImageIndex()].image_url) : '/goods-default.svg';
  });
  readonly isOnSale = computed(() => this.goods()?.status === 1);
  readonly isMine = computed(() => this.auth.currentUser()?.id === this.goods()?.user_id);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadGoods(id);
    if (this.auth.isLoggedIn()) {
      this.favoriteService
        .check(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => this.favorited.set(res.favorited));
    }
    this.categoryService.list()
      .pipe(takeUntil(this.destroy$))
      .subscribe((cats: Category[]) => {
        const cat = cats.find((c) => c.id === this.goods()?.category_id);
        if (cat) {
          this.categoryName.set(cat.name);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadGoods(id: number): void {
    this.goodsService
      .goodsDetail(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (goods) => {
          this.goods.set(goods);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('商品不存在或已删除', '知道了', { duration: 2500 });
          this.router.navigate(['/home']);
        },
      });
  }

  prevImage(): void {
    const len = this.images().length;
    if (len) {
      this.currentImageIndex.set((this.currentImageIndex() - 1 + len) % len);
    }
  }

  nextImage(): void {
    const len = this.images().length;
    if (len) {
      this.currentImageIndex.set((this.currentImageIndex() + 1) % len);
    }
  }

  selectImage(index: number): void {
    this.currentImageIndex.set(index);
  }

  toggleFavorite(): void {
    if (!this.requireLogin()) {
      return;
    }
    const id = this.goods()!.id;
    if (this.favorited()) {
      this.favoriteService
        .remove(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.favorited.set(false);
          this.snackBar.open('已取消收藏', '知道了', { duration: 2000 });
        });
    } else {
      this.favoriteService
        .add(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.favorited.set(true);
          this.snackBar.open('收藏成功', '知道了', { duration: 2000 });
        });
    }
  }

  contactSeller(): void {
    if (!this.requireLogin()) {
      return;
    }
    this.router.navigate(['/chat'], { queryParams: { peer: this.goods()!.user_id } });
  }

  buy(): void {
    if (!this.requireLogin()) {
      return;
    }
    const goods = this.goods()!;
    this.dialog
      .open(BuyConfirmDialog, { data: goods, width: '360px' })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.orderService
            .create(goods.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (res) => {
                this.snackBar.open(`下单成功，订单号 ${res.order_no}`, '知道了', { duration: 3000 });
                this.loadGoods(goods.id);
                this.router.navigate(['/order']);
              },
              error: (err) => this.snackBar.open(err.error?.detail ?? '下单失败', '知道了', { duration: 2500 }),
            });
        }
      });
  }

  private requireLogin(): boolean {
    if (!this.auth.isLoggedIn()) {
      this.snackBar.open('请先登录', '去登录', { duration: 2500 }).onAction().subscribe(() => {
        this.router.navigate(['/login']);
      });
      return false;
    }
    return true;
  }
}
