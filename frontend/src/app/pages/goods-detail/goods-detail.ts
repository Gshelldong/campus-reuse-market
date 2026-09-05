import { Component, OnDestroy, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { conditionText, goodsStatusStyle, goodsStatusText, imageUrl } from '../../core/api';
import { Category, Goods } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ChatService } from '../../core/services/chat.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { GoodsService } from '../../core/services/goods.service';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-goods-detail',
  imports: [
    DatePipe,
    RouterLink,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzModalModule,
    NzTagModule,
  ],
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
  private chatService = inject(ChatService);
  private auth = inject(AuthService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private destroy$ = new Subject<void>();
  private buyTpl = viewChild.required<TemplateRef<unknown>>('buyTpl');

  readonly goods = signal<Goods | null>(null);
  readonly loading = signal(true);
  readonly favorited = signal(false);
  readonly currentImageIndex = signal(0);
  readonly categoryName = signal('');

  readonly img = imageUrl;
  readonly conditionText = conditionText;
  readonly goodsStatusText = goodsStatusText;
  readonly goodsStatusStyle = goodsStatusStyle;
  readonly isLoggedIn = this.auth.isLoggedIn;

  readonly images = computed(() => this.goods()?.images ?? []);  readonly currentImage = computed(() => {
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
          this.message.error('商品不存在或已删除');
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
          this.message.info('已取消收藏');
        });
    } else {
      this.favoriteService
        .add(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.favorited.set(true);
          this.message.success('收藏成功');
        });
    }
  }

  contactSeller(): void {
    if (!this.requireLogin()) {
      return;
    }
    const goods = this.goods()!;
    const link = `${location.origin}/goods/${goods.id}`;
    this.chatService
      .send(goods.user_id, `我正在看「${goods.title}」，商品链接：${link}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.openChat(goods.user_id),
        error: () => this.openChat(goods.user_id),
      });
  }

  private openChat(peerId: number): void {
    this.router.navigate(['/chat'], { queryParams: { peer: peerId } });
  }

  buy(): void {
    if (!this.requireLogin()) {
      return;
    }
    const goods = this.goods()!;
    this.modal.confirm({
      nzTitle: '确认购买',
      nzWidth: 400,
      nzContent: this.buyTpl(),
      nzOkText: '确认下单',
      nzCancelText: '再想想',
      nzOnOk: () => {
        this.orderService
          .create(goods.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              this.loadGoods(goods.id);
              this.modal.success({
                nzTitle: '下单成功',
                nzContent: `订单号 ${res.order_no}，请在个人中心 - 我的订单中查看详情`,
                nzOkText: '确认',
                nzOnOk: () => this.router.navigate(['/home']),
              });
            },
            error: (err) => this.message.error(err.error?.detail ?? '下单失败'),
          });
      },
    });
  }

  private requireLogin(): boolean {
    if (!this.auth.isLoggedIn()) {
      this.message.warning('请先登录');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return false;
    }
    return true;
  }
}
