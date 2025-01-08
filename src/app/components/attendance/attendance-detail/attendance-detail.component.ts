import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { RouterLink } from '@angular/router';
import { EmployeeService } from '../../../services/employee.service';
import { AttendanceService } from '../../../services/attendance.service';
import { Router } from '@angular/router';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { EncryptionService } from '../../../shared/services/encryption.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-attendance-detail',
  templateUrl: './attendance-detail.component.html',
  styleUrls: ['./attendance-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    LoaderComponent,
    RouterLink,
    PaginationComponent,
    FormsModule,
    ReactiveFormsModule,
    ConfirmModalComponent
  ]
})
export class AttendanceDetailComponent implements OnInit {
  employee: any;
  attendanceRecords: any[] = [];
  isLoading = false;
  pageSizeOptions = [2,5, 10, 25, 50, 100];
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  // Add these properties
  selectedAttendances: number[] = [];
  selectAll: boolean = false;
  showDeleteModal = false;

  constructor(
    private employeeService: EmployeeService,
    private attendanceService: AttendanceService,
    private router: Router,
    private snackbar: SnackbarService,
    private encryptionService: EncryptionService
  ) {}

  ngOnInit(): void {
    this.loadEmployeeDetails();
  }

  private loadEmployeeDetails(): void {
    const encryptedData = localStorage.getItem('selectedEmployee');
    if (!encryptedData) {
      this.router.navigate(['/attendance']);
      return;
    }

    try {
      this.employee = JSON.parse(this.encryptionService.decrypt(encryptedData));
      this.loadAttendanceRecords();
    } catch (error) {
      this.snackbar.error('Failed to load employee details');
      this.router.navigate(['/attendance']);
    }
  }

  private loadAttendanceRecords(): void {
    this.isLoading = true;
    const params = {
      employeeId: this.employee.id,
      page: this.currentPage,
      size: this.pageSize
    };

    this.attendanceService.searchAttendance(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.attendanceRecords = response.data.content;
          this.totalPages = response.data.totalPages;
          this.totalElements = response.data.totalElements;
        }
        this.isLoading = false;
      },
      error: () => {
        this.snackbar.error('Failed to load attendance records');
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadAttendanceRecords();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadAttendanceRecords();
  }

  // Add these methods
  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.selectedAttendances = this.selectAll 
      ? this.attendanceRecords.map(record => record.id)
      : [];
  }

  toggleSelection(id: number): void {
    const index = this.selectedAttendances.indexOf(id);
    if (index === -1) {
      this.selectedAttendances.push(id);
    } else {
      this.selectedAttendances.splice(index, 1);
    }
    this.selectAll = this.selectedAttendances.length === this.attendanceRecords.length;
  }

  deleteSelected(): void {
    if (!this.selectedAttendances.length) {
      this.snackbar.error('Please select records to delete');
      return;
    }
    this.showDeleteModal = true;
  }

  onConfirmDelete(): void {
    this.isLoading = true;
    this.attendanceService.deleteAttendances(this.selectedAttendances).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackbar.success('Records deleted successfully');
          this.selectedAttendances = [];
          this.selectAll = false;
          this.loadAttendanceRecords();
        }
        this.showDeleteModal = false;
        this.isLoading = false;
      },
      error: (error) => {
        this.snackbar.error(error.message || 'Failed to delete records');
        this.showDeleteModal = false;
        this.isLoading = false;
      }
    });
  }

  onCancelDelete(): void {
    this.showDeleteModal = false;
  }
}
