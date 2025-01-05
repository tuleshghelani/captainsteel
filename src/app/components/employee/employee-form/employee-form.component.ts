import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { EmployeeService } from '../../../services/employee.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { SnackbarService } from '../../../shared/services/snackbar.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoaderComponent,
    RouterLink
  ],
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.scss']
})
export class EmployeeFormComponent implements OnInit {
  employeeForm!: FormGroup;
  isLoading = false;
  isEditMode = false;
  employeeId?: number;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private router: Router,
    private route: ActivatedRoute,
    private snackbar: SnackbarService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.employeeId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.employeeId) {
      this.isEditMode = true;
      this.loadEmployee();
    }
  }

  private initializeForm(): void {
    this.employeeForm = this.fb.group({
      name: [null, [Validators.required]],
      mobileNumber: [null, []],
      email: [null, [Validators.email]],
      address: [null, []],
      designation: [null, []],
      department: [null, []],
      status: ['A']
    });
  }

  private formatDateForApi(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year} 00:00:00`;
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      this.isLoading = true;
      const formData = { ...this.employeeForm.value };

      const request = this.isEditMode
        ? this.employeeService.updateEmployee(this.employeeId!, formData)
        : this.employeeService.createEmployee(formData);

      request.subscribe({
        next: (response) => {
          if (response.success) {
            this.snackbar.success(response.message);
            this.router.navigate(['/employee']);
          }
        },
        error: (error) => {
          this.snackbar.error(error.message || `Failed to ${this.isEditMode ? 'update' : 'create'} employee`);
          this.isLoading = false;
        }
      });
    } else {
      Object.keys(this.employeeForm.controls).forEach(key => {
        const control = this.employeeForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  private loadEmployee(): void {
    if (!this.employeeId) return;
    
    this.isLoading = true;
    this.employeeService.getEmployeeDetail(this.employeeId).subscribe({
      next: (response) => {
        if (response.success) {
          this.employeeForm.patchValue({
            name: response.data.name,
            mobileNumber: response.data.mobileNumber,
            email: response.data.email,
            address: response.data.address,
            designation: response.data.designation,
            department: response.data.department,
            status: response.data.status
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.snackbar.error(error?.error?.message || 'Failed to load employee details');
        this.isLoading = false;
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const control = this.employeeForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['email']) return 'Invalid email format';
      if (control.errors['pattern']) return 'Invalid mobile number format';
    }
    return '';
  }
} 