import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './register.html',
  styleUrl: './login.css',
})
export class RegisterPage {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  readonly hidePassword = signal(true);
  readonly errorMsg = signal('');
  readonly loading = signal(false);

  form = this.fb.group({
    username: this.fb.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]),
    nickname: this.fb.control('', [Validators.maxLength(50)]),
    phone: this.fb.control('', [Validators.pattern(/^1\d{10}$/)]),
    password: this.fb.control('', [Validators.required, Validators.minLength(6), Validators.maxLength(64)]),
    confirmPassword: this.fb.control('', [Validators.required]),
  });

  submit(): void {
    this.errorMsg.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, nickname, phone, password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) {
      this.errorMsg.set('两次输入的密码不一致');
      return;
    }
    this.loading.set(true);
    this.auth.register({ username, password, nickname, phone }).subscribe({
      next: () => {
        this.snackBar.open('注册成功，请登录', '知道了', { duration: 2500 });
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.detail ?? '注册失败，请稍后再试');
      },
    });
  }
}
