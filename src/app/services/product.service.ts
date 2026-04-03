import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private cloudName = environment.cloudinaryCloudName;
  private uploadPreset = environment.cloudinaryUploadPreset;

  // --- MÉTODOS PÚBLICOS ---

  getProducts(page: number = 1): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/available`, {
      params: { page: page.toString() }
    });
  }

  saveProduct(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products/save`, data);
  }

  getMyProducts(page: number, idUser: number, idStatus: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products/my-products`, {
      page,
      idUser,
      idStatus
    });
  }

  changeStatus(
    idProduct: number,
    idUser: number,
    idStatus: number,
    description?: string
  ): Observable<any> {
    const payload: Record<string, unknown> = {
      idProduct,
      idUser,
      idStatus
    };

    if (description !== undefined) {
      payload['description'] = description;
    }

    return this.http.put<any>(`${this.apiUrl}/products/change-status`, payload);
  }

  uploadImage(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', this.uploadPreset);
    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    return this.http.post<any>(url, form).pipe(
      map(res => res.secure_url)
    );
  }

  // --- MÉTODOS ADMINISTRATIVOS ---

  getMetrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/metrics`);
  }

  getRequestedProducts(page: number = 1): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/requested`, { params: { page: page.toString() } });
  }

  getHistory(page: number = 1, filter: 'Denegados' | 'Aprobados'): Observable<any> {
    return this.http.request('POST', `${this.apiUrl}/products/history/status/changes`, {
      body: {
        page: page,
        filter: filter
      }
    });
  }
}
