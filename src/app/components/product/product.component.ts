import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { ToastrService } from 'ngx-toastr';
import { trigger, transition, style, animate } from '@angular/animations';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
  standalone: true,
  imports: [
    LoaderComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    PaginationComponent,
    RouterModule
  ],
  animations: [
    trigger('dialogAnimation', [
      transition(':enter', [
        style({ transform: 'translate(-50%, -48%) scale(0.95)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ transform: 'translate(-50%, -48%) scale(0.95)', opacity: 0 }))
      ])
    ])
  ]
})
export class ProductComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  productForm!: FormGroup;
  searchForm!: FormGroup;
  isLoading = false;
  isEditing = false;
  editingId?: number;
  
  // Pagination properties
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];
  totalPages = 0;
  totalElements = 0;
  startIndex = 0;
  endIndex = 0;
  isDialogOpen = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private snackbarService: SnackbarService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  private initializeForms(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      categoryId: ['', Validators.required],
      description: [null],
      minimumStock: [0, [Validators.required, Validators.min(0)]],
      purchaseAmount: [0, [Validators.required, Validators.min(0)]],
      saleAmount: [0, [Validators.required, Validators.min(0)]],
      status: ['A', Validators.required]
    });

    this.searchForm = this.fb.group({
      search: [''],
      categoryId: [''],
      status: ['A']
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories({ status: 'A' }).subscribe({
      next: (response) => {
        this.categories = response.data;
      },
      error: () => {
        this.snackbarService.error('Failed to load categories');
      }
    });
  }

  loadProducts(): void {
    if (!this.isLoading) {
      this.isLoading = true;
    }
    
    const searchParams = {
      ...this.searchForm.value,
      size: this.pageSize,
      page: this.currentPage
    };

    this.productService.searchProducts(searchParams).subscribe({
      next: (response) => {
        this.products = response.data.content;
        this.totalPages = response.data.totalPages;
        this.totalElements = response.data.totalElements;
        this.startIndex = this.currentPage * this.pageSize;
        this.endIndex = Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
        this.isLoading = false;
      },
      error: () => {
        this.snackbarService.error('Failed to load products');
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      this.isLoading = true;
      const product = this.productForm.value;
      let tempIsEditing = this.isEditing;
      const request = this.isEditing
        ? this.productService.updateProduct(this.editingId!, product)
        : this.productService.createProduct(product);

      request.subscribe({
        next: (response) => {
          this.snackbarService.success(response.message);
          this.resetForm();
          this.isLoading = false;
          console.log('this.isEditing', this.isEditing);
          if(tempIsEditing) {
            this.closeDialog();
          }
        },
        error: (error) => {
          this.snackbarService.error(error.message || 'Operation failed');
          this.isLoading = false;
        }
      });
    }
  }

  editProduct(product: Product): void {
    this.isEditing = true;
    this.editingId = product.id;
    this.productForm.patchValue({
      name: product.name,
      categoryId: product.categoryId,
      description: product.description,
      minimumStock: product.minimumStock,
      purchaseAmount: product.purchaseAmount,
      saleAmount: product.saleAmount,
      status: product.status
    });
    this.isDialogOpen = true;
  }

  deleteProduct(id: number): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.isLoading = true;
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.snackbarService.success('Product deleted successfully');
          this.loadProducts();
          // this.isLoading = false;
        },
        error: () => {
          this.snackbarService.error('Failed to delete product');
          this.isLoading = false;
        }
      });
    }
  }

  resetForm(): void {
    this.isEditing = false;
    this.editingId = undefined;
    this.productForm.reset({ status: 'A' });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.isLoading = true;
    this.loadProducts();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProducts();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 0;
    this.loadProducts();
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.editingId = undefined;
    this.productForm.reset({ status: 'A' });
    this.isDialogOpen = true;
  }

  closeDialog(): void {
    if (!this.productForm.dirty) {
      this.isLoading = false;
    }
    this.isDialogOpen = false;
    this.resetForm();
    this.loadProducts();
  }
}