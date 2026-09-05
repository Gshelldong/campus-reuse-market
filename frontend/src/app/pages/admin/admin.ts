import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import {
  GOODS_STATUS,
  ORDER_STATUS,
  goodsStatusColor,
  goodsStatusText,
  imageUrl,
  orderStatusColor,
  orderStatusText,
} from '../../core/api';
import { Category, GoodsListItem, Order, PageResult, User } from '../../core/models';
import { CategoryService } from '../../core/services/category.service';
import { GoodsService } from '../../core/services/goods.service';
import { OrderService } from '../../core/services/order.service';
import { UserService } from '../../core/services/user.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-admin',
  imports: [
    FormsModule,
    DatePipe,
    RouterLink,
    NzTabsModule,
    NzSelectModule,
    NzButtonModule,
    NzInputModule,
    NzIconModule,
    NzTagModule,
    NzPaginationModule,
    NzSpinModule,
    NzModalModule,
    NzPopconfirmModule,
    NzToolTipModule,
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminPage implements OnInit, OnDestroy {
  private goodsService = inject(GoodsService);
  private userService = inject(UserService);
  private categoryService = inject(CategoryService);
  private orderService = inject(OrderService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private destroy$ = new Subject<void>();

  readonly img = imageUrl;
  readonly goodsStatusText = goodsStatusText;
  readonly goodsStatusColor = goodsStatusColor;
  readonly orderStatusText = orderStatusText;
  readonly orderStatusColor = orderStatusColor;
  readonly goodsStatusOptions = GOODS_STATUS;
  readonly orderStatusOptions = ORDER_STATUS;
  readonly pageSize = PAGE_SIZE;

  /** 商品状态胶囊样式 */
  goodsStatusStyle(status: number): string {
    const map: Record<number, string> = {
      0: 'color:#d97706;background:#d977061a',
      1: 'color:#16a34a;background:#16a34a1a',
      2: 'color:#2563eb;background:#2563eb1a',
      3: 'color:#64748b;background:#64748b1a',
    };
    return map[status] ?? map[3];
  }

  /** 订单状态胶囊样式 */
  orderStatusStyle(status: number): string {
    const map: Record<number, string> = {
      0: 'color:#d97706;background:#d977061a',
      1: 'color:#16a34a;background:#16a34a1a',
      2: 'color:#64748b;background:#64748b1a',
    };
    return map[status] ?? map[2];
  }

  // ---- 商品审核 ----
  readonly goodsLoading = signal(true);
  readonly goodsResult = signal<PageResult<GoodsListItem> | null>(null);
  readonly goodsRecords = signal<GoodsListItem[]>([]);
  readonly goodsPageIndex = signal(1);
  goodsKeyword = '';
  goodsStatusFilter: number | null = null;
  private goodsKeyword$ = new Subject<string>();

  // ---- 用户管理 ----
  readonly users = signal<User[]>([]);
  readonly usersLoading = signal(false);

  // ---- 分类管理 ----
  readonly categories = signal<Category[]>([]);
  readonly categoriesLoading = signal(false);
  categoryModalVisible = false;
  categoryEditing: Category | null = null;
  categoryName = '';
  categorySort = 0;

  // ---- 订单查看 ----
  readonly ordersLoading = signal(true);
  readonly ordersResult = signal<PageResult<Order> | null>(null);
  readonly ordersRecords = signal<Order[]>([]);
  readonly ordersPageIndex = signal(1);
  orderStatusFilter: number | null = null;

  ngOnInit(): void {
    this.loadGoods();
    this.loadUsers();
    this.loadCategories();
    this.loadOrders();

    this.goodsKeyword$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.goodsPageIndex.set(1);
        this.loadGoods();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============ 商品审核 ============

  onGoodsKeywordInput(value: string): void {
    this.goodsKeyword$.next(value);
  }

  onGoodsFilterChange(): void {
    this.goodsPageIndex.set(1);
    this.loadGoods();
  }

  onGoodsPageChange(page: number): void {
    this.goodsPageIndex.set(page);
    this.loadGoods();
  }

  audit(goods: GoodsListItem, approved: boolean): void {
    this.goodsService
      .auditGoods(goods.id, approved)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.message.success(res.message || '操作成功');
          this.loadGoods();
        },
        error: (err: HttpErrorResponse) => this.message.error(err.error?.detail ?? '操作失败'),
      });
  }

  offlineGoods(goods: GoodsListItem): void {
    this.goodsService
      .offlineGoods(goods.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.message.success('已下架');
          this.loadGoods();
        },
        error: (err: HttpErrorResponse) => this.message.error(err.error?.detail ?? '操作失败'),
      });
  }

  private loadGoods(): void {
    this.goodsLoading.set(true);
    this.goodsService
      .adminListGoods({
        page: this.goodsPageIndex(),
        page_size: PAGE_SIZE,
        keyword: this.goodsKeyword || undefined,
        status: this.goodsStatusFilter,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.goodsResult.set(res);
          this.goodsRecords.set(res.records);
          this.goodsLoading.set(false);
        },
        error: () => this.goodsLoading.set(false),
      });
  }

  // ============ 用户管理 ============

  toggleUserStatus(user: User): void {
    this.userService
      .toggleUserStatus(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.message.success(res.status === 1 ? '该账号已禁用' : '该账号已恢复');
          this.loadUsers();
        },
        error: (err: HttpErrorResponse) => this.message.error(err.error?.detail ?? '操作失败'),
      });
  }

  private loadUsers(): void {
    this.usersLoading.set(true);
    this.userService
      .listUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.users.set(list);
          this.usersLoading.set(false);
        },
        error: () => this.usersLoading.set(false),
      });
  }

  // ============ 分类管理（对话框 CRUD） ============

  openCategoryModal(cat: Category | null): void {
    this.categoryEditing = cat;
    this.categoryName = cat?.name ?? '';
    this.categorySort = cat?.sort ?? 0;
    this.categoryModalVisible = true;
  }

  closeCategoryModal(): void {
    this.categoryModalVisible = false;
  }

  saveCategory(): void {
    const name = this.categoryName.trim();
    if (!name) {
      this.message.warning('请输入分类名称');
      return;
    }
    const req$ = this.categoryEditing
      ? this.categoryService.update(this.categoryEditing.id, { name, sort: this.categorySort })
      : this.categoryService.create({ name, sort: this.categorySort });
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.message.success(this.categoryEditing ? '分类已更新' : '分类已添加');
        this.categoryModalVisible = false;
        this.loadCategories();
      },
      error: (err: HttpErrorResponse) => this.message.error(err.error?.detail ?? '保存失败'),
    });
  }

  deleteCategory(cat: Category): void {
    this.categoryService
      .delete(cat.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.message.success('分类已删除');
          this.loadCategories();
        },
        error: (err: HttpErrorResponse) => this.message.error(err.error?.detail ?? '删除失败'),
      });
  }

  private loadCategories(): void {
    this.categoriesLoading.set(true);
    this.categoryService
      .list()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.categories.set(list);
          this.categoriesLoading.set(false);
        },
        error: () => this.categoriesLoading.set(false),
      });
  }

  // ============ 订单查看 ============

  onOrderFilterChange(): void {
    this.ordersPageIndex.set(1);
    this.loadOrders();
  }

  onOrdersPageChange(page: number): void {
    this.ordersPageIndex.set(page);
    this.loadOrders();
  }

  private loadOrders(): void {
    this.ordersLoading.set(true);
    this.orderService
      .adminList(this.ordersPageIndex(), PAGE_SIZE, this.orderStatusFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.ordersResult.set(res);
          this.ordersRecords.set(res.records);
          this.ordersLoading.set(false);
        },
        error: () => this.ordersLoading.set(false),
      });
  }
}
