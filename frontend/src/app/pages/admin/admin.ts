import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
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
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTabsModule,
    RouterLink,
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminPage implements OnInit, OnDestroy {
  private goodsService = inject(GoodsService);
  private userService = inject(UserService);
  private categoryService = inject(CategoryService);
  private orderService = inject(OrderService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  readonly img = imageUrl;
  readonly goodsStatusText = goodsStatusText;
  readonly goodsStatusColor = goodsStatusColor;
  readonly orderStatusText = orderStatusText;
  readonly orderStatusColor = orderStatusColor;
  readonly goodsStatusOptions = GOODS_STATUS;
  readonly orderStatusOptions = ORDER_STATUS;

  readonly tabIndex = signal(0);

  // ---- 商品审核 ----
  readonly goodsLoading = signal(true);
  readonly goodsResult = signal<PageResult<GoodsListItem> | null>(null);
  readonly goodsRecords = signal<GoodsListItem[]>([]);
  readonly goodsPageIndex = signal(0);
  goodsKeyword = '';
  goodsStatusFilter: number | null = null;
  private goodsKeyword$ = new Subject<string>();

  // ---- 用户管理 ----
  readonly users = signal<User[]>([]);
  readonly usersLoading = signal(false);

  // ---- 分类管理 ----
  readonly categories = signal<Category[]>([]);
  newCategoryName = '';
  newCategorySort = 0;
  editingCategoryId: number | null = null;
  editingCategoryName = '';

  // ---- 订单查看 ----
  readonly ordersLoading = signal(true);
  readonly ordersResult = signal<PageResult<Order> | null>(null);
  readonly ordersRecords = signal<Order[]>([]);
  readonly ordersPageIndex = signal(0);
  orderStatusFilter: number | null = null;

  ngOnInit(): void {
    this.loadGoods();
    this.loadUsers();
    this.loadCategories();
    this.loadOrders();

    this.goodsKeyword$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.goodsPageIndex.set(0);
        this.loadGoods();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(index: number): void {
    this.tabIndex.set(index);
  }

  // ============ 商品审核 ============

  onGoodsKeywordInput(value: string): void {
    this.goodsKeyword$.next(value);
  }

  onGoodsFilterChange(): void {
    this.goodsPageIndex.set(0);
    this.loadGoods();
  }

  onGoodsPageChange(event: PageEvent): void {
    this.goodsPageIndex.set(event.pageIndex);
    this.loadGoods();
  }

  audit(goods: GoodsListItem, approved: boolean): void {
    this.goodsService
      .auditGoods(goods.id, approved)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.snackBar.open(res.message, '知道了', { duration: 2000 });
          this.loadGoods();
        },
        error: (err: HttpErrorResponse) => this.snackBar.open(err.error?.detail ?? '操作失败', '知道了', { duration: 2500 }),
      });
  }

  offlineGoods(goods: GoodsListItem): void {
    this.goodsService
      .offlineGoods(goods.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.snackBar.open('已下架', '知道了', { duration: 2000 });
        this.loadGoods();
      });
  }

  private loadGoods(): void {
    this.goodsLoading.set(true);
    this.goodsService
      .adminListGoods({
        page: this.goodsPageIndex() + 1,
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
          this.snackBar.open(res.status === 1 ? '该账号已禁用' : '该账号已恢复', '知道了', { duration: 2000 });
          this.loadUsers();
        },
        error: (err: HttpErrorResponse) => this.snackBar.open(err.error?.detail ?? '操作失败', '知道了', { duration: 2500 }),
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

  // ============ 分类管理 ============

  addCategory(): void {
    const name = this.newCategoryName.trim();
    if (!name) {
      this.snackBar.open('请输入分类名称', '知道了', { duration: 2000 });
      return;
    }
    this.categoryService
      .create({ name, sort: this.newCategorySort })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.newCategoryName = '';
          this.newCategorySort = 0;
          this.snackBar.open('分类已添加', '知道了', { duration: 2000 });
          this.loadCategories();
        },
        error: (err: HttpErrorResponse) => this.snackBar.open(err.error?.detail ?? '添加失败', '知道了', { duration: 2500 }),
      });
  }

  startEditCategory(cat: Category): void {
    this.editingCategoryId = cat.id;
    this.editingCategoryName = cat.name;
  }

  saveCategoryEdit(cat: Category): void {
    const name = this.editingCategoryName.trim();
    if (!name) {
      return;
    }
    this.categoryService
      .update(cat.id, { name })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.editingCategoryId = null;
          this.snackBar.open('分类已更新', '知道了', { duration: 2000 });
          this.loadCategories();
        },
        error: (err: HttpErrorResponse) => this.snackBar.open(err.error?.detail ?? '更新失败', '知道了', { duration: 2500 }),
      });
  }

  cancelCategoryEdit(): void {
    this.editingCategoryId = null;
  }

  deleteCategory(cat: Category): void {
    if (confirm(`确定删除分类「${cat.name}」吗？`)) {
      this.categoryService
        .delete(cat.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('分类已删除', '知道了', { duration: 2000 });
            this.loadCategories();
          },
          error: (err: HttpErrorResponse) => this.snackBar.open(err.error?.detail ?? '删除失败', '知道了', { duration: 2500 }),
        });
    }
  }

  private loadCategories(): void {
    this.categoryService
      .list()
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => this.categories.set(list));
  }

  // ============ 订单查看 ============

  onOrderFilterChange(): void {
    this.ordersPageIndex.set(0);
    this.loadOrders();
  }

  onOrdersPageChange(event: PageEvent): void {
    this.ordersPageIndex.set(event.pageIndex);
    this.loadOrders();
  }

  private loadOrders(): void {
    this.ordersLoading.set(true);
    this.orderService
      .adminList(this.ordersPageIndex() + 1, PAGE_SIZE, this.orderStatusFilter)
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
