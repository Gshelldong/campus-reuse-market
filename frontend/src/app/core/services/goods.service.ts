import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Goods, GoodsListItem, PageResult } from '../models';

export interface GoodsQuery {
  page?: number;
  page_size?: number;
  keyword?: string;
  category_id?: number;
  order_by?: string;
  status?: number | null;
}

@Injectable({ providedIn: 'root' })
export class GoodsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  listGoods(query: GoodsQuery): Observable<PageResult<GoodsListItem>> {
    return this.http.get<PageResult<GoodsListItem>>(`${this.apiUrl}/api/goods`, {
      params: cleanParams(query),
    });
  }

  myGoods(page: number, pageSize: number): Observable<PageResult<GoodsListItem>> {
    return this.http.get<PageResult<GoodsListItem>>(`${this.apiUrl}/api/goods/my`, {
      params: { page, page_size: pageSize },
    });
  }

  goodsDetail(id: number): Observable<Goods> {
    return this.http.get<Goods>(`${this.apiUrl}/api/goods/${id}`);
  }

  publishGoods(form: FormData): Observable<Goods> {
    return this.http.post<Goods>(`${this.apiUrl}/api/goods`, form);
  }

  updateGoods(id: number, data: Partial<GoodsQuery & Goods>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/api/goods/${id}`, data);
  }

  deleteGoods(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/api/goods/${id}`);
  }

  offlineGoods(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/api/goods/${id}/offline`, {});
  }

  adminListGoods(query: GoodsQuery): Observable<PageResult<GoodsListItem>> {
    return this.http.get<PageResult<GoodsListItem>>(`${this.apiUrl}/api/goods/admin/list`, {
      params: cleanParams(query),
    });
  }

  auditGoods(id: number, approved: boolean): Observable<{ message: string; status: number }> {
    return this.http.put<{ message: string; status: number }>(
      `${this.apiUrl}/api/goods/admin/${id}/audit`,
      {},
      { params: { approved } },
    );
  }
}

function cleanParams(query: GoodsQuery): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = String(value);
    }
  }
  return params;
}
