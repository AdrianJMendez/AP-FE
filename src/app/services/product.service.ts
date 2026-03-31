import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl;
  private cloudName = environment.cloudinaryCloudName;
  private uploadPreset = environment.cloudinaryUploadPreset;

  constructor(private http: HttpClient) { }

  getProducts(page: number = 1) {
    return this.http.get<any>(`${this.apiUrl}/products/available`, {
      params: { page: page.toString() }
    });
  }

  saveProduct(data: any) {
    return this.http.post<any>(`${this.apiUrl}/products/save`, data);
  }

  deleteProduct(idProduct: number, idUser: number) {
    return this.http.post<any>(`${this.apiUrl}/products/delete`, { idProduct, idUser });
  }

  uploadImage(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', this.uploadPreset);

    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    return this.http.post<any>(url, form).pipe(
      switchMap(res => {
        if (!res?.secure_url) throw new Error('Cloudinary no devolvió URL');
        return [res.secure_url as string];
      })
    );
  }
}