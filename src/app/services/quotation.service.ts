import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CreateQuotationRequest, QuotationResponse } from '../models/quotation.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class QuotationService {
  private apiUrl = `${environment.apiUrl}/api/quotations`;

  constructor(private http: HttpClient) { }

  createQuotation(quotation: CreateQuotationRequest): Observable<QuotationResponse> {
    return this.http.post<QuotationResponse>(`${this.apiUrl}/create`, quotation);
  }

  searchQuotations(params: any): Observable<QuotationResponse> {
    return this.http.post<QuotationResponse>(`${this.apiUrl}/search`, params);
  }

  deleteQuotation(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  generatePdf(id: number): Observable<{ blob: Blob; filename: string }> {
    return this.http.post(`${this.apiUrl}/generate-pdf`, { id }, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => {
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 'quotation.pdf';
        const blob = new Blob([response.body!], { type: 'application/pdf' });
        return { blob, filename };
      })
    );
  }

  updateQuotationStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-status`, { id, status });
  }
}
