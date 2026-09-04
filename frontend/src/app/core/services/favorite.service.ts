import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FavoriteItem, PageResult } from '../models';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  add(goodsId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/api/favorite/${goodsId}`, {});
  }

  remove(goodsId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/api/favorite/${goodsId}`);
  }

  check(goodsId: number): Observable<{ favorited: boolean }> {
    return this.http.get<{ favorited: boolean }>(`${this.apiUrl}/api/favorite/check/${goodsId}`);
  }

  my(page: number, pageSize: number): Observable<PageResult<FavoriteItem>> {
    return this.http.get<PageResult<FavoriteItem>>(`${this.apiUrl}/api/favorite/my`, {
      params: { page, page_size: pageSize },
    });
  }
}
