import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  list(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/api/category/list`);
  }

  create(data: { name: string; sort: number }): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/api/category`, data);
  }

  update(id: number, data: { name?: string; sort?: number }): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/api/category/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/api/category/${id}`);
  }
}
