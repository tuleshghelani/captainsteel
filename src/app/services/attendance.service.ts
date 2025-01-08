import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/api/attendance`;

  constructor(private http: HttpClient) {}

  createAttendance(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, data);
  }

  searchAttendance(params: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/search`, params);
  }

  deleteAttendances(attendanceIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/delete`, { attendanceIds });
  }
} 