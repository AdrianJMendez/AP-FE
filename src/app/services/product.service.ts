import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private http: HttpClient) {}

  getProducts(page: number = 1) {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get('http://localhost:3000/products/available', { params });
  }

  saveProduct(data: any) {
    return this.http.post('http://localhost:3000/products/save', data);
  }

  uploadImage(formData: FormData) {
    return this.http.post('http://localhost:3000/upload', formData);
  }
}