import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { goodsStatusStyle, goodsStatusText, imageUrl } from '../../core/api';
import { GoodsListItem, PageResult } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { GoodsService } from '../../core/services/goods.service';
import { UploadService } from '../../core/services/upload.service';
import { UserService } from '../../core/services/user.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-profile',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    NzButtonModule,
    NzInputModule,
    NzIconModule,
    NzTabsModule,
    NzSpinModule,
    NzPaginationModule,
    NzPopconfirmModule,
    NzToolTipModule,
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
  private message = inject(NzMessageService);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  readonly currentUser = this.auth.currentUser;
  readonly img = imageUrl;
  readonly goodsStatusText = goodsStatusText;
  readonly goodsStatusStyle = goodsStatusStyle;

  readonly tabIndex = signal(0);
  readonly avatarUploading = signal(false);
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);

  readonly goodsLoading = signal(true);
  readonly goodsResult = signal<PageResult<GoodsListItem> | null>(null);
  readonly goodsRecords = signal<GoodsListItem[]>([]);
  readonly goodsPageIndex = signal(1);
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
                this.message.success('头像已更新');
              },
              error: () => this.avatarUploading.set(false),
            });
        },
        error: () => {
          this.avatarUploading.set(false);
          this.message.error('头像上传失败');
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
          this.message.success('资料已更新');
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
      this.message.warning('两次输入的新密码不一致');
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
          this.message.success('密码修改成功，请牢记新密码');
        },
        error: (err: HttpErrorResponse) => {
          this.savingPassword.set(false);
          this.message.error(err.error?.detail ?? '密码修改失败');
        },
      });
  }

  onGoodsPageChange(page: number): void {
    this.goodsPageIndex.set(page);
    this.loadMyGoods();
  }

  offlineGoods(goods: GoodsListItem): void {
    this.goodsService
      .offlineGoods(goods.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.message.success('已下架');
          this.loadMyGoods();
        },
        error: (err: HttpErrorResponse) => this.message.error(err.error?.detail ?? '操作失败'),
      });
  }

  deleteGoods(goods: GoodsListItem): void {
    this.goodsService
      .deleteGoods(goods.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.message.success('已删除');
          this.loadMyGoods();
        },
        error: (err: HttpErrorResponse) => this.message.error(err.error?.detail ?? '删除失败'),
      });
  }

  private loadMyGoods(): void {
    this.goodsLoading.set(true);
    this.goodsService
      .myGoods(this.goodsPageIndex(), this.goodsPageSize)
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
