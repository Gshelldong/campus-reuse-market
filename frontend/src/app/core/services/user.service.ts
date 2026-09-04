import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/user/me`);
  }

  updateMe(data: { nickname?: string; phone?: string; avatar?: string }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/api/user/me`, data);
  }

  updatePassword(oldPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/api/user/password`, {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }

  listUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/api/user/list`);
  }

  toggleUserStatus(userId: number): Observable<{ message: string; status: number }> {
    return this.http.put<{ message: string; status: number }>(`${this.apiUrl}/api/user/${userId}/status`, {});
  }
}
