import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipSelectionChange } from '@angular/material/chips';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { GoodsCard } from '../../shared/goods-card';
import { Category, GoodsListItem, PageResult } from '../../core/models';
import { CategoryService } from '../../core/services/category.service';
import { GoodsService } from '../../core/services/goods.service';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-home',
  imports: [
    FormsModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatProgressSpinnerModule,
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
  private keyword$ = new Subject<string>();

  selectedCategoryId: number | null = null;
  orderBy = '';
  pageIndex = 0;
  readonly pageSize = PAGE_SIZE;

  ngOnInit(): void {
    this.categoryService.list().subscribe((cats) => this.categories.set(cats));

    this.keyword$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.load();
      });

    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(value: string): void {
    this.keyword$.next(value);
  }

  clearKeyword(): void {
    if (this.keyword) {
      this.keyword = '';
      this.pageIndex = 0;
      this.load();
    }
  }

  onChipSelect(id: number | null, event: MatChipSelectionChange): void {
    if (!event.selected) {
      return;
    }
    this.selectedCategoryId = id;
    this.pageIndex = 0;
    this.load();
  }

  onOrderByChange(): void {
    this.pageIndex = 0;
    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.goodsService
      .listGoods({
        page: this.pageIndex + 1,
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
