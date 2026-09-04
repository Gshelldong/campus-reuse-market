import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { imageUrl } from '../../core/api';
import { Goods } from '../../core/models';

@Component({
  selector: 'app-buy-confirm-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>确认购买</h2>
    <mat-dialog-content>
      <div class="goods-brief">
        <img [src]="cover" alt="" />
        <div>
          <p class="title">{{ data.title }}</p>
          <p class="price">¥{{ data.price }}</p>
        </div>
      </div>
      <p class="tip">模拟交易，下单后请与卖家线下完成交易，并在订单页确认完成。</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>再想想</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="true">确认下单</button>
    </mat-dialog-actions>
  `,
  styles: `
    .goods-brief {
      display: flex;
      gap: 12px;
      align-items: center;

      img {
        width: 72px;
        height: 54px;
        object-fit: cover;
        border-radius: 4px;
        background: #eceff1;
      }

      .title {
        margin: 0 0 4px;
        font-weight: 500;
      }

      .price {
        margin: 0;
        color: #f44336;
        font-weight: 600;
      }
    }

    .tip {
      color: #888;
      font-size: 13px;
      margin: 12px 0 0;
    }
  `,
})
export class BuyConfirmDialog {
  readonly data = inject<Goods>(MAT_DIALOG_DATA);
  readonly cover = this.data.images?.length ? imageUrl(this.data.images[0].image_url) : '/goods-default.svg';
}
