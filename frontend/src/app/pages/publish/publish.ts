import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { CONDITION_OPTIONS, imageUrl } from '../../core/api';
import { Category, Goods } from '../../core/models';
import { CategoryService } from '../../core/services/category.service';
import { GoodsService } from '../../core/services/goods.service';

@Component({
  selector: 'app-publish',
  imports: [
    ReactiveFormsModule,
    NzButtonModule,
    NzImageModule,
    NzSelectModule,
    NzIconModule,
    NzInputModule,
    RouterLink,
  ],
  templateUrl: './publish.html',
  styleUrl: './publish.css',
})
export class PublishPage implements OnDestroy {
  private fb = inject(NonNullableFormBuilder);
  private goodsService = inject(GoodsService);
  private categoryService = inject(CategoryService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  readonly conditionOptions = CONDITION_OPTIONS;
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);

  readonly editId = signal<number | null>(null);
  readonly existingImages = signal<Goods['images']>([]);
  readonly newFiles = signal<File[]>([]);
  readonly previewUrls = computed(() => this.newFiles().map((f) => URL.createObjectURL(f)));

  readonly img = imageUrl;

  form = this.fb.group({
    title: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
    description: this.fb.control('', [Validators.maxLength(2000)]),
    price: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    originalPrice: this.fb.control<number | null>(null),
    condition: this.fb.control(2, [Validators.required]),
    categoryId: this.fb.control<number | null>(null, [Validators.required]),
  });

  constructor() {
    this.categoryService.list()
      .pipe(takeUntil(this.destroy$))
      .subscribe((cats) => this.categories.set(cats));

    const id = Number(this.route.snapshot.queryParamMap.get('id'));
    if (id) {
      this.editId.set(id);
      this.loading.set(true);
      this.goodsService
        .goodsDetail(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (goods) => {
            this.form.patchValue({
              title: goods.title,
              description: goods.description,
              price: Number(goods.price),
              originalPrice: goods.original_price !== null ? Number(goods.original_price) : null,
              condition: goods.condition,
              categoryId: goods.category_id,
            });
            this.existingImages.set(goods.images);
            this.loading.set(false);
          },
          error: () => {
            this.message.error('商品不存在');
            this.router.navigate(['/profile']);
          },
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.previewUrls().forEach((url) => URL.revokeObjectURL(url));
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }
    this.newFiles.update((files) => [...files, ...Array.from(input.files!)]);
    input.value = '';
  }

  removeNewFile(index: number): void {
    const urls = this.previewUrls();
    URL.revokeObjectURL(urls[index]);
    this.newFiles.update((files) => files.filter((_, i) => i !== index));
  }

  removeExistingImage(index: number): void {
    this.existingImages.update((images) => images.filter((_, i) => i !== index));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const value = this.form.getRawValue();

    if (this.editId()) {
      this.submitEdit(value);
    } else {
      this.submitCreate(value);
    }
  }

  private submitCreate(value: ReturnType<typeof this.form.getRawValue>): void {
    const form = new FormData();
    form.append('title', value.title);
    form.append('description', value.description ?? '');
    form.append('price', String(value.price));
    if (value.originalPrice) {
      form.append('original_price', String(value.originalPrice));
    }
    form.append('condition', String(value.condition));
    form.append('category_id', String(value.categoryId));
    for (const file of this.newFiles()) {
      form.append('images', file);
    }

    this.goodsService
      .publishGoods(form)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.message.success('发布成功，等待管理员审核');
          this.router.navigate(['/profile'], { queryParams: { tab: 'goods' } });
        },
        error: (err: HttpErrorResponse) => this.fail(err),
      });
  }

  private submitEdit(value: ReturnType<typeof this.form.getRawValue>): void {
    this.goodsService
      .updateGoods(this.editId()!, {
        title: value.title,
        description: value.description ?? '',
        price: value.price!,
        original_price: value.originalPrice ?? null,
        condition: value.condition,
        category_id: value.categoryId!,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.message.success('修改成功，已重新提交审核');
          this.router.navigate(['/profile'], { queryParams: { tab: 'goods' } });
        },
        error: (err: HttpErrorResponse) => this.fail(err),
      });
  }

  private fail(err: HttpErrorResponse): void {
    this.submitting.set(false);
    this.message.error(err.error?.detail ?? '提交失败，请稍后再试');
  }
}
