import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, PageResult } from '../models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  create(goodsId: number): Observable<{ message: string; order_id: number; order_no: string }> {
    return this.http.post<{ message: string; order_id: number; order_no: string }>(
      `${this.apiUrl}/api/order/${goodsId}`,
      {},
    );
  }

  my(page: number, pageSize: number, role: 'all' | 'buyer' | 'seller' = 'all'): Observable<PageResult<Order>> {
    return this.http.get<PageResult<Order>>(`${this.apiUrl}/api/order/my`, {
      params: { page, page_size: pageSize, role },
    });
  }

  confirm(orderId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/api/order/${orderId}/confirm`, {});
  }

  cancel(orderId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/api/order/${orderId}/cancel`, {});
  }

  adminList(page: number, pageSize: number, status: number | null): Observable<PageResult<Order>> {
    const params: Record<string, string> = { page: String(page), page_size: String(pageSize) };
    if (status !== null && status !== undefined) {
      params['status'] = String(status);
    }
    return this.http.get<PageResult<Order>>(`${this.apiUrl}/api/order/admin/list`, { params });
  }
}
