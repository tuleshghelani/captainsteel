import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { QuotationResponse, QuotationSearchRequest } from '../models/quotation.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuotationService {
private apiUrl = `${environment.apiUrl}/api/quotations`;

  constructor(private http: HttpClient) { }

  searchQuotations(params: QuotationSearchRequest): Observable<QuotationResponse> {
    return this.http.post<QuotationResponse>(`${this.apiUrl}/searchQuotation`, params);
  }

  createQuotation(quotation: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, quotation);
  }

  deleteQuotation(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
