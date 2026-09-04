import { Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { conditionText, goodsStatusColor, goodsStatusText, imageUrl } from '../core/api';
import { GoodsListItem } from '../core/models';

@Component({
  selector: 'app-goods-card',
  imports: [MatCardModule, MatIconModule, RouterLink],
  templateUrl: './goods-card.html',
  styleUrl: './goods-card.css',
})
export class GoodsCard {
  readonly goods = input.required<GoodsListItem>();
  readonly showStatus = input(false);

  readonly cover = computed(() => {
    const url = imageUrl(this.goods().cover_image);
    return url || '/goods-default.svg';
  });
  readonly conditionText = conditionText;
  readonly goodsStatusText = goodsStatusText;
  readonly goodsStatusColor = goodsStatusColor;
}
