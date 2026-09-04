import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { conditionText, goodsStatusText, imageUrl } from '../../core/api';
import { FavoriteItem, PageResult } from '../../core/models';
import { FavoriteService } from '../../core/services/favorite.service';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-favorite',
  imports: [
    CommonModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './favorite.html',
  styleUrl: './favorite.css',
})
export class FavoritePage implements OnInit {
  private favoriteService = inject(FavoriteService);
  private snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly result = signal<PageResult<FavoriteItem> | null>(null);
  readonly records = signal<FavoriteItem[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = PAGE_SIZE;

  readonly img = imageUrl;
  readonly conditionText = conditionText;
  readonly goodsStatusText = goodsStatusText;

  ngOnInit(): void {
    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.load();
  }

  remove(goodsId: number): void {
    this.favoriteService
      .remove(goodsId)
      .pipe(take(1))
      .subscribe(() => {
        this.snackBar.open('已取消收藏', '知道了', { duration: 2000 });
        this.load();
      });
  }

  private load(): void {
    this.loading.set(true);
    this.favoriteService
      .my(this.pageIndex() + 1, this.pageSize)
      .pipe(take(1))
      .subscribe((res) => {
        this.result.set(res);
        this.records.set(res.records);
        this.loading.set(false);
      });
  }
}
