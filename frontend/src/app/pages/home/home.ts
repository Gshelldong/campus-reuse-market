import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Subject, takeUntil } from 'rxjs';
import { GoodsCard } from '../../shared/goods-card';
import { Category, GoodsListItem, PageResult } from '../../core/models';
import { CategoryService } from '../../core/services/category.service';
import { GoodsService } from '../../core/services/goods.service';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: '', label: '最新发布' },
  { value: 'price_asc', label: '价格从低到高' },
  { value: 'price_desc', label: '价格从高到低' },
] as const;

@Component({
  selector: 'app-home',
  imports: [
    FormsModule,
    NzInputModule,
    NzButtonModule,
    NzPaginationModule,
    NzSpinModule,
    NzIconModule,
    GoodsCard,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomePage implements OnInit, OnDestroy {
  private goodsService = inject(GoodsService);
  private categoryService = inject(CategoryService);
  private destroy$ = new Subject<void>();

  readonly loading = signal(false);
  readonly categories = signal<Category[]>([]);
  readonly result = signal<PageResult<GoodsListItem> | null>(null);
  readonly records = signal<GoodsListItem[]>([]);

  keyword = '';

  selectedCategoryId: number | null = null;
  orderBy = '';
  pageIndex = 1;
  readonly pageSize = PAGE_SIZE;
  readonly sortOptions = SORT_OPTIONS;

  ngOnInit(): void {
    this.categoryService.list().subscribe((cats) => this.categories.set(cats));
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.load();
  }

  clearKeyword(): void {
    if (this.keyword) {
      this.keyword = '';
      this.pageIndex = 1;
      this.load();
    }
  }

  onChipSelect(id: number | null): void {
    this.selectedCategoryId = id === this.selectedCategoryId ? null : id;
    this.pageIndex = 1;
    this.load();
  }

  onSortChange(value: string): void {
    this.orderBy = value;
    this.pageIndex = 1;
    this.load();
  }

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.goodsService
      .listGoods({
        page: this.pageIndex,
        page_size: this.pageSize,
        keyword: this.keyword || undefined,
        category_id: this.selectedCategoryId ?? undefined,
        order_by: this.orderBy || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.records.set(res.records);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
