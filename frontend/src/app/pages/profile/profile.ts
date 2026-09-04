import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { goodsStatusColor, goodsStatusText, imageUrl } from '../../core/api';
import { GoodsListItem, PageResult } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { GoodsService } from '../../core/services/goods.service';
import { UploadService } from '../../core/services/upload.service';
import { UserService } from '../../core/services/user.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage implements OnInit, OnDestroy {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private goodsService = inject(GoodsService);
  private uploadService = inject(UploadService);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  readonly currentUser = this.auth.currentUser;
  readonly img = imageUrl;
  readonly goodsStatusText = goodsStatusText;
  readonly goodsStatusColor = goodsStatusColor;

  readonly tabIndex = signal(0);
  readonly avatarUploading = signal(false);
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);

  readonly goodsLoading = signal(true);
  readonly goodsResult = signal<PageResult<GoodsListItem> | null>(null);
  readonly goodsRecords = signal<GoodsListItem[]>([]);
  readonly goodsPageIndex = signal(0);
  readonly goodsPageSize = PAGE_SIZE;

  profileForm = this.fb.group({
    nickname: this.fb.control('', [Validators.maxLength(50)]),
    phone: this.fb.control('', [Validators.pattern(/^1\d{10}$/)]),
  });

  passwordForm = this.fb.group({
    oldPassword: this.fb.control('', [Validators.required]),
    newPassword: this.fb.control('', [Validators.required, Validators.minLength(6), Validators.maxLength(64)]),
    confirmPassword: this.fb.control('', [Validators.required]),
  });

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'goods') {
      this.tabIndex.set(2);
    }
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm.patchValue({ nickname: user.nickname, phone: user.phone });
    }
    this.loadMyGoods();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(index: number): void {
    this.tabIndex.set(index);
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.avatarUploading.set(true);
    this.uploadService
      .uploadImage(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.userService
            .updateMe({ avatar: res.url })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (user) => {
                this.auth.syncUser(user);
                this.avatarUploading.set(false);
                this.snackBar.open('头像已更新', '知道了', { duration: 2000 });
              },
              error: () => this.avatarUploading.set(false),
            });
        },
        error: () => {
          this.avatarUploading.set(false);
          this.snackBar.open('头像上传失败', '知道了', { duration: 2000 });
        },
      });
    input.value = '';
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.savingProfile.set(true);
    this.userService
      .updateMe(this.profileForm.getRawValue())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.auth.syncUser(user);
          this.savingProfile.set(false);
          this.snackBar.open('资料已更新', '知道了', { duration: 2000 });
        },
        error: () => this.savingProfile.set(false),
      });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { oldPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.snackBar.open('两次输入的新密码不一致', '知道了', { duration: 2500 });
      return;
    }
    this.savingPassword.set(true);
    this.userService
      .updatePassword(oldPassword, newPassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.savingPassword.set(false);
          this.passwordForm.reset();
          this.snackBar.open('密码修改成功，请牢记新密码', '知道了', { duration: 2500 });
        },
        error: (err: HttpErrorResponse) => {
          this.savingPassword.set(false);
          this.snackBar.open(err.error?.detail ?? '密码修改失败', '知道了', { duration: 2500 });
        },
      });
  }

  onGoodsPageChange(event: PageEvent): void {
    this.goodsPageIndex.set(event.pageIndex);
    this.loadMyGoods();
  }

  offlineGoods(goods: GoodsListItem): void {
    this.goodsService
      .offlineGoods(goods.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.snackBar.open('已下架', '知道了', { duration: 2000 });
        this.loadMyGoods();
      });
  }

  deleteGoods(goods: GoodsListItem): void {
    if (confirm(`确定删除「${goods.title}」吗？删除后不可恢复。`)) {
      this.goodsService
        .deleteGoods(goods.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.snackBar.open('已删除', '知道了', { duration: 2000 });
          this.loadMyGoods();
        });
    }
  }

  private loadMyGoods(): void {
    this.goodsLoading.set(true);
    this.goodsService
      .myGoods(this.goodsPageIndex() + 1, this.goodsPageSize)
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
}
