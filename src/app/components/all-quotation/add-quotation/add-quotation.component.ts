import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { formatDate } from '@angular/common';
import { Dialog, DialogRef } from '@angular/cdk/dialog';

import { QuotationService } from '../../../services/quotation.service';
import { ProductService } from '../../../services/product.service';
import { CustomerService } from '../../../services/customer.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EncryptionService } from '../../../shared/services/encryption.service';
import { DateUtils } from '../../../shared/utils/date-utils';
import { animate, style, transition, trigger } from '@angular/animations';
import { ProductMainType, ProductCalculationType } from '../../../models/product.model';
import { ProductCalculationDialogComponent } from '../../../components/shared/product-calculation-dialog/product-calculation-dialog.component';
import { ProductMMCalculationDialogComponent } from '../../../components/shared/product-mm-calculation-dialog/product-mm-calculation-dialog.component';

interface ProductOption {
  id: number;
  name: string;
  sale_amount: number;
  tax_percentage: number;
}

@Component({
  selector: 'app-add-quotation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LoaderComponent,
    SearchableSelectComponent,
    PaginationComponent
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
  ],
  templateUrl: './add-quotation.component.html',
  styleUrls: ['./add-quotation.component.scss']
})
export class AddQuotationComponent implements OnInit, OnDestroy {
  quotationForm!: FormGroup;
  createQuotationForm!: FormGroup;
  products: any[] = [];
  customers: any[] = [];
  loading = false;
  isLoadingProducts = false;
  isLoadingCustomers = false;
  minValidUntilDate: string;
  private destroy$ = new Subject<void>();
  isLoading = false;
  isEdit = false;
  quotationId?: number;
  isDialogOpen = false;
  selectedProduct!: string

  get itemsFormArray() {
    return this.quotationForm.get('items') as FormArray;
  }

  get quotationProductFormArray(){
    return this.quotationForm.get('quotationProducts') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private quotationService: QuotationService,
    private productService: ProductService,
    private customerService: CustomerService,
    private snackbar: SnackbarService,
    private encryptionService: EncryptionService,
    private dateUtils: DateUtils,
    private router: Router,
    private dialog: Dialog
  ) {
      const today = new Date();
    this.minValidUntilDate = formatDate(today, 'yyyy-MM-dd', 'en');
    this.initForm();
  }

  ngOnInit() {
    this.loadProducts();
    this.loadCustomers();
    this.setupCustomerNameSync();
    this.checkForEdit();
    this.addProduct()
    // this.createQuotationTableFormGroup();
    // Initially adding one row in table
    // this.addRow();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // get rows(): FormArray {
  //   return this.quotationTableForm.get('quotationTable') as FormArray;
  // }

  addRow(): void {
    const row = this.fb.group({
      feet: ['', Validators.required],
      inch: ['', Validators.required],
      rFeet: ['', Validators.required],
      sqFt: ['', Validators.required],
      weight: ['', Validators.required]
    });
    const quotationTable = (this.quotationForm.get('quotationProducts') as FormArray)
      .at(this.productIndex).get('quotationTable') as FormArray;
    quotationTable.push(row);  // Add the new row to the form array
  }

  // Get the quotationTable form array for the selected product
  getQuotationTable(): FormArray | null {
    try {
      const quotationProducts = this.quotationForm.get('quotationProducts') as FormArray;
      if (!quotationProducts || this.productIndex === undefined) return null;
      
      const product = quotationProducts.at(this.productIndex);
      if (!product) return null;
      
      return product.get('quotationTable') as FormArray;
    } catch (error) {
      console.error('Error getting quotation table:', error);
      return null;
    }
  }

  deleteRow(index: number): void {
    const quotationTable = (this.quotationForm.get('quotationProducts') as FormArray)
      .at(this.productIndex).get('quotationTable') as FormArray;
    if (quotationTable.length > 1) {
      quotationTable.removeAt(index);  // Remove the row at the specified index
    }
  }

  // onProductSelected(event:Event,index:number){
  //   const selectedProduct = (event.target as HTMLSelectElement).value;
  //   const Products = this.quotationForm.get('quotationProducts') as FormArray
  //   Products.at(index).get('selectedProduct')?.setValue(selectedProduct)
  //   this.addRow()
  //   console.log('selectedProduct >>>',selectedProduct, this.products)
  //   console.log('quotationForm >>>',this.quotationForm.value)
  //   this.selectedProduct = selectedProduct
  //   this.isDialogOpen = true;
  // }

  closeDialog(){
    this.isDialogOpen = false;
  }

  private initForm() {
    const today = new Date();
    const validUntil = new Date();
    validUntil.setDate(today.getDate() + 7);

    this.quotationForm = this.fb.group({
      customerId: [''],
      customerName: ['', Validators.required],
      contactNumber: ['', Validators.required],
      quoteDate: [formatDate(today, 'yyyy-MM-dd', 'en')],
      validUntil: [formatDate(validUntil, 'yyyy-MM-dd', 'en'), [Validators.required]],
      remarks: [''],
      termsConditions: [''],
      items: this.fb.array([]),
      address: ['', Validators.required],
      quotationProducts: this.fb.array([])
    });

    this.addItem();
  }

  private createItemFormGroup(initialData?: any): FormGroup {
    return this.fb.group({
      productId: [initialData?.productId || '', Validators.required],
      productType: [initialData?.productType || ''],
      calculationType: [initialData?.calculationType || 'SQ_FEET'],
      quantity: [initialData?.quantity || 1, [Validators.required, Validators.min(1)]],
      weight: [{ value: initialData?.weight || 0, disabled: true }],
      unitPrice: [initialData?.unitPrice || 0, [Validators.required, Validators.min(0.01)]],
      discountPercentage: [initialData?.discountPercentage || 0, [Validators.required, Validators.min(0), Validators.max(100)]],
      taxPercentage: [{ value: 18, disabled: true }],
      finalPrice: [{ value: initialData?.finalPrice || 0, disabled: true }]
    });
  }

  // createQuotationTableFormGroup(): FormGroup {
  //   return this.quotationTableForm = this.fb.group({
  //     selectedProduct: ['',Validators.required],
  //     quotationTable: this.fb.array([])  // An array to hold the rows
  //   });
  // }

  private setupCustomerNameSync() {
    this.quotationForm.get('customerId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(customerId => {
        if (customerId) {
          const selectedCustomer = this.customers.find(c => c.id === customerId);
          if (selectedCustomer) {
            this.quotationForm.patchValue({ customerName: selectedCustomer.name });
          }
        }
      });
  }

  addItem() {
    const itemGroup = this.createItemFormGroup();
    this.setupItemCalculations(itemGroup, this.itemsFormArray.length);
    this.itemsFormArray.push(itemGroup);
  }

  private createProductFormGroup(): FormGroup {
    return this.fb.group({
      selectedProduct: ['', Validators.required],
      quotationTable: this.fb.array([])
    });
  }

  addProduct() {
    const productGroup = this.createProductFormGroup();
    this.quotationProductFormArray.push(productGroup);
  }

  productIndex!: number

  addRowToQuotationTable(productIndex: number) {
    const quotationTable = (this.quotationForm.get('quotationProducts') as FormArray)
      .at(productIndex)
      .get('quotationTable') as FormArray;
  
    quotationTable.push(this.fb.group({
      feet: [0],
      inch: [0],
      rFeet: [0],
      sqFt: [0],
      weight: ['']
    }));
  }

  deleteTableRow(productIndex: number, rowIndex: number) {
    const quotationTable = (this.quotationForm.get('quotationProducts') as FormArray)
      .at(productIndex)
      .get('quotationTable') as FormArray;
  
    quotationTable.removeAt(rowIndex);
  }

  removeProduct(index: number) {
    if (this.quotationProductFormArray.length > 1) {
      this.quotationProductFormArray.removeAt(index);
    }
  }

  removeItem(index: number) {
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
      this.calculateTotalAmount();
    }
  }

  private setupItemCalculations(group: FormGroup, index: number) {
    const fields = ['quantity', 'unitPrice', 'taxPercentage', 'discountPercentage'];
    
    fields.forEach(field => {
      group.get(field)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.calculateItemPrice(index);
        });
    });
  }

  private calculateItemPrice(index: number): void {
    const group = this.itemsFormArray.at(index) as FormGroup;
    const values = {
      quantity: group.get('quantity')?.value || 0,
      unitPrice: group.get('unitPrice')?.value || 0,
      discountPercentage: group.get('discountPercentage')?.value || 0,
      taxPercentage: 18 // Fixed 18%
    };

    const basePrice = values.quantity * values.unitPrice;
    const discountAmount = (basePrice * values.discountPercentage) / 100;
    const afterDiscount = basePrice - discountAmount;
    const taxAmount = (afterDiscount * values.taxPercentage) / 100;
    const finalPrice = afterDiscount + taxAmount;

    group.patchValue({ 
      finalPrice: Number(finalPrice.toFixed(2))
    }, { emitEvent: false });

    this.calculateTotalAmount();
  }

  getTotalAmount(): number {
    return this.itemsFormArray.controls
      .reduce((total, group: any) => total + (group.get('finalPrice').value || 0), 0);
  }

  private loadProducts(): void {
    this.isLoadingProducts = true;
    this.productService.getProducts({ status: 'A' }).subscribe({
      next: (response) => {
        if (response.success) {
          this.products = response.data;
        }
        this.isLoadingProducts = false;
      },
      error: (error) => {
        this.snackbar.error('Failed to load products');
        this.isLoadingProducts = false;
      }
    });
  }

  refreshProducts(): void {
    this.isLoadingProducts = true;
    this.productService.refreshProducts().subscribe({
      next: (response) => {
        if (response.success) {
          this.products = response.data;
          this.snackbar.success('Products refreshed successfully');
        }
        this.isLoadingProducts = false;
      },
      error: (error) => {
        this.snackbar.error('Failed to refresh products');
        this.isLoadingProducts = false;
      }
    });
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

  private calculateTotalAmount(): void {
    const total = this.itemsFormArray.controls
      .reduce((sum, group: any) => sum + (group.get('finalPrice').value || 0), 0);
    
    this.quotationForm.patchValue({ totalAmount: total }, { emitEvent: false });
  }

  resetForm(): void {
    const today = new Date();
    const validUntil = new Date();
    validUntil.setDate(today.getDate() + 7);

    this.quotationForm.reset({
      quoteDate: formatDate(today, 'yyyy-MM-dd', 'en'),
      validUntil: formatDate(validUntil, 'yyyy-MM-dd', 'en'),
      remarks: '',
      termsConditions: ''
    });

    // Clear items array and add one empty item
    while (this.itemsFormArray.length) {
      this.itemsFormArray.removeAt(0);
    }
    this.addItem();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.quotationForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  isItemFieldInvalid(index: number, fieldName: string): boolean {
    const control = this.itemsFormArray.at(index).get(fieldName);
    if (!control) return false;

    const isInvalid = control.invalid && (control.dirty || control.touched);
    
    if (isInvalid) {
      const errors = control.errors;
      if (errors) {
        if (errors['required']) return true;
        if (errors['min'] && fieldName === 'quantity') return true;
        if (errors['min'] && fieldName === 'unitPrice') return true;
        if ((errors['min'] || errors['max']) && 
            (fieldName === 'taxPercentage' || fieldName === 'discountPercentage')) return true;
      }
    }
    
    return false;
  }

  getFieldError(fieldName: string): string {
    const control = this.quotationForm.get(fieldName);
    if (control?.errors) {
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['min']) return `${fieldName} must be greater than ${control.errors['min'].min}`;
      if (control.errors['max']) return `${fieldName} must be less than ${control.errors['max'].max}`;
    }
    return '';
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach(control => {
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control.markAsTouched();
        control.markAsDirty();
      }
    });
  }

  onProductSelect(index: number, event: any): void {
    console.log('Product Select Event:', event);
    console.log('Index:', index);
    
    const selectedProduct = this.products.find(p => p.id === event.value);
    console.log('Selected Product:', selectedProduct);
    
    if (!selectedProduct) {
      console.warn('No product found for id:', event.value);
      return;
    }

    const itemGroup = this.itemsFormArray.at(index);
    itemGroup.patchValue({
      productId: selectedProduct.id,
      productType: selectedProduct.type,
      unitPrice: selectedProduct.sale_amount || 0,
      weight: selectedProduct.weight || 0,
      calculationType: ''
    });

    if (selectedProduct.type === 'REGULAR') {
      itemGroup.get('quantity')?.disable();
      this.openCalculationDialog(index);
    } else {
      itemGroup.get('quantity')?.enable();
    }

    this.calculateItemPrice(index);
  }

  openCalculationDialog(index: number): void {
    const itemGroup = this.itemsFormArray.at(index);
    const selectedProduct = this.products.find(p => p.id === itemGroup.get('productId')?.value);
    
    if (!selectedProduct || selectedProduct.type.toUpperCase() !== ProductMainType.REGULAR.toString().toUpperCase()) {
      return;
    }

    const calculationType = itemGroup.get('calculationType')?.value || 'SQ_FEET';
    
    if (calculationType === ProductCalculationType.MM) {
      const dialogRef = this.dialog.open(ProductMMCalculationDialogComponent, {
        data: { product: selectedProduct }
      });

      dialogRef.closed.subscribe((result?: any) => {
        if (result) {
          itemGroup.patchValue({
            weight: result.totalWeight,
            quantity: result.totalSqMM
          });
          this.calculateItemPrice(index);
        }
      });
    } else {
      const dialogRef = this.dialog.open(ProductCalculationDialogComponent, {
        data: { 
          product: selectedProduct,
          calculationType: calculationType
        }
      });

      dialogRef.closed.subscribe((result?: any) => {
        if (result) {
          itemGroup.patchValue({
            weight: result.totalWeight,
            quantity: result.totalSqFeet
          });
          this.calculateItemPrice(index);
        }
      });
    }
  }

  validateDates(): void {
    const quoteDate = this.quotationForm.get('quoteDate')?.value;
    const validUntil = this.quotationForm.get('validUntil')?.value;

    if (quoteDate && validUntil && new Date(validUntil) < new Date(quoteDate)) {
      this.quotationForm.get('validUntil')?.setErrors({ invalidDate: true });
    }
  }

  // onSubmit() {
  //   if (this.quotationForm.valid) {
  //     this.loading = true;
  //     const formData = this.prepareQuotationData();

  //     this.quotationService.createQuotation(formData).subscribe({
  //       next: (response) => {
  //         if (response.success) {
  //           this.snackbar.success(response.message);
  //           this.resetForm();
  //         }
  //         this.loading = false;
  //       },
  //       error: (error) => {
  //         this.snackbar.error(error?.error?.message || 'Failed to create quotation');
  //         this.loading = false;
  //       }
  //     });
  //   }
  // }

  private prepareQuotationData() {
    const formValue = this.quotationForm.value;
    return {
      ...formValue,
      quoteDate: formatDate(formValue.quoteDate, 'yyyy-MM-dd', 'en'),
      validUntil: formatDate(formValue.validUntil, 'yyyy-MM-dd', 'en'),
      items: formValue.items.map((item: any) => ({
        ...item,
        finalPrice: this.itemsFormArray.at(formValue.items.indexOf(item)).get('finalPrice')?.value
      }))
    };
  }

  private checkForEdit(): void {
    const encryptedId = localStorage.getItem('editQuotationId');
    
    if (!encryptedId) {
      return;
    }

    try {
      const quotationId = this.encryptionService.decrypt(encryptedId);
      
      if (!quotationId) {
        localStorage.removeItem('editQuotationId');
        return;
      }

      this.isLoading = true;
      this.quotationService.getQuotationDetail(parseInt(quotationId)).subscribe({
        next: (response) => {
          if (response) {
            this.quotationId = parseInt(quotationId);
            this.isEdit = true;
            this.populateForm(response.data);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading quotation details:', error);
          this.snackbar.error('Failed to load quotation details');
          this.isLoading = false;
          localStorage.removeItem('editQuotationId');
        }
      });
    } catch (error) {
      console.error('Decryption error:', error);
      localStorage.removeItem('editQuotationId');
    }
  }

  private populateForm(data: any): void {
    if (!data) return;
  
    // Clear existing items first
    while (this.itemsFormArray.length) {
      this.itemsFormArray.removeAt(0);
    }
  
    // Patch basic form values
    this.quotationForm.patchValue({
      customerName: data.customerName,
      customerId: data.customerId,
      quoteDate: data.quoteDate,
      validUntil: data.validUntil,
      remarks: data.remarks || '',
      termsConditions: data.termsConditions || ''
    });
  
    // Add items
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item: any) => {
        const itemGroup = this.createItemFormGroup({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxPercentage: item.taxPercentage,
          discountPercentage: item.discountPercentage,
          finalPrice: item.finalPrice
        });
        this.setupItemCalculations(itemGroup, this.itemsFormArray.length);
        this.itemsFormArray.push(itemGroup);
      });
    }
  }

  onSubmit(): void {
    if (this.quotationForm.valid) {
      this.isLoading = true;
      const formData = this.prepareFormData();
      
      const request$ = this.isEdit 
        ? this.quotationService.updateQuotation(this.quotationId!, formData)
        : this.quotationService.createQuotation(formData);

      request$.subscribe({
        next: (response: any) => {
          if (response.success) {
            this.snackbar.success(`Quotation ${this.isEdit ? 'updated' : 'created'} successfully`);
            this.router.navigate(['/quotation']);
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          this.snackbar.error(error?.error?.message || `Failed to ${this.isEdit ? 'update' : 'create'} quotation`);
          this.isLoading = false;
        }
      });
    }
  }

  private prepareFormData() {
    const formValue = this.quotationForm.value;
    return {
      ...formValue,
      quoteDate: formatDate(formValue.quoteDate, 'yyyy-MM-dd', 'en'),
      validUntil: formatDate(formValue.validUntil, 'yyyy-MM-dd', 'en'),
      items: formValue.items.map((item: any) => ({
        ...item,
        finalPrice: this.itemsFormArray.at(formValue.items.indexOf(item)).get('finalPrice')?.value
      }))
    };
  }

  isProductFieldInvalid(index: number, fieldName: string): boolean {
    const control = this.quotationProductFormArray.at(index).get(fieldName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }
 
  onCalculationTypeChange(index: number, event: any): void {
    console.log('event >>>', event);
    const itemGroup = this.itemsFormArray.at(index);
    const calculationType = event.target.value;
    const selectedProduct = this.products.find(p => p.id === itemGroup.get('productId')?.value);
    
    console.log('selectedProduct >>>', selectedProduct);
    console.log('calculationType >>>', calculationType);
    console.log('selectedProduct.type >>>', selectedProduct?.type);
    console.log('ProductMainType.REGULAR >>>', ProductMainType.REGULAR);
    
    if (!selectedProduct || selectedProduct.type.toUpperCase() != ProductMainType.REGULAR.toString().toUpperCase()) {
      console.log('Condition failed - returning');
      return;
    }

    console.log('itemGroup >>>', itemGroup);
    
    // Reset values when calculation type changes
    itemGroup.patchValue({
      weight: 0,
      quantity: 0
    });

    // Open the appropriate calculation dialog
    this.openCalculationDialog(index);
  }

}
