import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Employee, EmployeeResponse, EmployeeSearchRequest } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/api/employees`;

  constructor(private http: HttpClient) {}

  searchEmployees(params: EmployeeSearchRequest): Observable<EmployeeResponse> {
    return this.http.post<EmployeeResponse>(`${this.apiUrl}/search`, params);
  }

  createEmployee(employee: Partial<Employee>): Observable<any> {
    return this.http.post(this.apiUrl, employee);
  }

  updateEmployee(id: number, employee: Partial<Employee>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, employee);
  }

  deleteEmployee(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getEmployeeDetail(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/detail`, { id });
  }

  getAllEmployees(): Observable<any> {
    return this.http.post(`${this.apiUrl}/all`, {});
  }
} 