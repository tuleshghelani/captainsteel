import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuotationService } from '../../services/quotation.service';
import { CustomerService } from '../../services/customer.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModalService } from '../../services/modal.service';
import { DateUtils } from '../../shared/utils/date-utils';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SaleModalComponent } from '../sale-modal/sale-modal.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { SearchableSelectComponent } from '../../shared/components/searchable-select/searchable-select.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-quotation',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule, 
    RouterModule,
    MatDialogModule,
    SaleModalComponent,
    LoaderComponent,
    SearchableSelectComponent,
    PaginationComponent
  ],
  templateUrl: './quotation.component.html',
  styleUrl: './quotation.component.scss'
})
export class QuotationComponent {
quotations: any[] = [];
searchForm!: FormGroup;
isLoading = false;


// Pagination properties
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];
  totalPages = 0;
  totalElements = 0;
  startIndex = 0;
  endIndex = 0;
  selectedQuotation:any = null;
  products: any[] = [];
  isLoadingProducts = false;
  customers: any[] = [];
  isLoadingCustomers = false;

  constructor(
    private quotationService: QuotationService,
    private customerService: CustomerService,
    private fb: FormBuilder,
    private snackbar: SnackbarService,
    private dialog: MatDialog,
    private modalService: ModalService,
    private dateUtils: DateUtils,
  ){
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadQuotations();
    this.loadCustomers();
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      search: [''],
      customerId: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  loadQuotations(): void {
    this.isLoading = true;
    const params = {
      currentPage: this.currentPage,
      perPageRecord: this.pageSize,
      startDate: this.searchForm.value.startDate ? this.dateUtils.formatDate(this.searchForm.value.startDate) : '',
      endDate: this.searchForm.value.endDate ? this.dateUtils.formatDate(this.searchForm.value.endDate) : '',
      ...this.searchForm.value,
    };

    this.quotationService.searchQuotations(params).subscribe({
      next: (response:any) => {
        this.quotations = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.startIndex = this.currentPage * this.pageSize;
        this.endIndex = Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
        this.isLoading = false;
      },
      error: (error:any) => {
        this.snackbar.error(error.message || 'Failed to load quotations');
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadQuotations();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadQuotations();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 0;
    this.loadQuotations();
  }

  openSaleModal(quotation: any) {
    this.selectedQuotation = quotation;
    this.modalService.open('sale');
  }

  deleteQuotation(id: number): void {
    if (confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
      this.isLoading = true;
      this.quotationService.deleteQuotation(id).subscribe({
        next: () => {
          this.snackbar.success('Quotation deleted successfully');
          this.loadQuotations();
        },
        error: (error) => {
          this.snackbar.error(error?.error?.message || 'Failed to delete quotation');
          this.isLoading = false;
        }
      });
    }
  }

  private loadCustomers(): void {
    this.isLoadingCustomers = true;
    this.customerService.getCustomers({ status: 'A' }).subscribe({
      next: (response) => {
        if (response.success) {
          this.customers = response.data;
        }
        this.isLoadingCustomers = false;
      },
      error: (error) => {
        this.snackbar.error('Failed to load customers');
        this.isLoadingCustomers = false;
      }
    });
  }

  refreshCustomers(): void {
    this.isLoadingCustomers = true;
    this.customerService.refreshCustomers().subscribe({
      next: (response) => {
        if (response.success) {
          this.customers = response.data;
          this.snackbar.success('Customers refreshed successfully');
        }
        this.isLoadingCustomers = false;
      },
      error: (error) => {
        this.snackbar.error('Failed to refresh customers');
        this.isLoadingCustomers = false;
      }
    });
  }

  resetForm(): void {
    this.searchForm.reset();
    this.currentPage = 0;
    this.loadQuotations();
  }
}
