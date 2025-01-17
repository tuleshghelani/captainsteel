import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { formatDate } from '@angular/common';

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
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

  // get quotationProductFormArray() {
  //   return this.quotationForm.get('quotationProducts') as FormArray;
  // }

  constructor(
    private fb: FormBuilder,
    private quotationService: QuotationService,
    private productService: ProductService,
    private customerService: CustomerService,
    private snackbar: SnackbarService,
    private encryptionService: EncryptionService,
    private dateUtils: DateUtils,
    private router: Router
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
    // this.addProduct()
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addRow(): void {
    const newRow = this.prepareTableRow();
    this.quotationTableFormArray.push(newRow);  // Add the new row to the form array
  }

  prepareTableRow() {
    const isSF = this.selectedProductDetails.type === 'REGULAR' && this.selectedProductDetails.subType === 'SF';
    const isMM = this.selectedProductDetails.type === 'REGULAR' && this.selectedProductDetails.subType === 'MM';
    return this.fb.group(
      isSF
        ? {
          feet: [null, Validators.required],
          inch: [null, Validators.required],
          nos: [null, Validators.required],
          rFeet: [0, Validators.required],
          sqFt: [0, Validators.required],
          weight: [0, Validators.required],
        }
        : isMM
          ? {
            sizeInMM: [null, Validators.required],
            sizeInRFeet: [null, Validators.required],
            nos: [null, Validators.required],
            rFeet: [0, Validators.required],
          }
          : {}
    );
  }

  deleteRow(rowIndex: number) {
    this.quotationTableFormArray.removeAt(rowIndex);
  }

  closeDialog() {
    this.isDialogOpen = false;
    localStorage.removeItem('productTable');
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
      address: ['', Validators.required]
    });

    this.addItem();
  }

  private createItemFormGroup(item?: any): FormGroup {
    return this.fb.group({
      productId: [item?.productId || '', Validators.required],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(1)]],
      unitPrice: [item?.unitPrice || '', [Validators.required, Validators.min(0.01)]],
      taxPercentage: [18, [Validators.required, Validators.min(0), Validators.max(100)]],
      discountPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      finalPrice: [{ value: item?.finalPrice || 0, disabled: true }],
      productTable: this.fb.array([])
    });
  }

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
    if (this.selectedProduct === '') {
      return this.snackbar.error('Please select product first');
    }

    const itemGroup = this.createItemFormGroup();

    this.setupItemCalculations(itemGroup, this.itemsFormArray.length);
    this.itemsFormArray.push(itemGroup);

    this.itemsFormArray.controls.forEach((group, index) => {
      group.get('productId')?.valueChanges.subscribe((value) => {
        this.productIndex = index;
        this.selectedProductDetails = this.products.find(product => product.id === value);
        console.log('selected product >>>>', this.selectedProductDetails, index)
        this.selectedProduct = this.selectedProductDetails.name;
        const newRow = this.prepareTableRow();
        // if(this.selectedProductDetails?.type === "NOS"){
        //   ((this.quotationForm.get('items') as FormArray).at(index) as FormGroup).removeControl('productTable')
        //   this.quotationForm.updateValueAndValidity();
        // }
        this.quotationTableFormArray?.clear(); // firs clear table while change product
        this.quotationTableFormArray?.push(newRow)
        this.calculateTableFieldLogic(index)
        console.log(this.selectedProductDetails.type)
        if (this.selectedProductDetails.type !== 'NOS') this.isDialogOpen = true;
      });
    });
    this.selectedProduct = ''
  }

  calculateTableFieldLogic(index: number) {
    this.quotationTableFormArray.valueChanges.subscribe((rows) => {
      const quantity = this.itemsFormArray.at(index).value.quantity;
      rows.forEach((row: any, index: number) => {
        let rFeet
        if (this.selectedProductDetails.type === 'NOS') {
          rFeet = (row.feet + row.inch / 12) * quantity
        } else if (this.selectedProductDetails.type === 'REGULAR' && this.selectedProductDetails.subType === 'SF') {
          rFeet = (row.feet + row.inch / 12) * row.nos
        } else {
          rFeet = (row.feet + row.inch / 12)
        }
        const sqFt = rFeet * 3.5;
        const weight = rFeet * this.selectedProductDetails.weight; // weight based on product
        // Access the specific FormGroup and update the controls
        const formGroup = this.quotationTableFormArray.at(index) as FormGroup;
        formGroup.get('rFeet')?.setValue(rFeet, { emitEvent: false }); // Prevent infinite loop
        formGroup.get('sqFt')?.setValue(sqFt, { emitEvent: false });
        formGroup.get('weight')?.setValue(weight, { emitEvent: false });
      });
    });
  }

  productIndex!: number;
  selectedProductDetails: any

  // Get the productTable form array for the selected product
  get quotationTableFormArray(): FormArray {
    return (this.quotationForm.get('items') as FormArray).at(this.productIndex).get('productTable') as FormArray;
  }

  // get quotationTableFormArray(): FormArray {
  //   return (this.quotationForm.get('quotationProducts') as FormArray).at(this.productIndex).get('productTable') as FormArray;
  // }

  editSelectedProductTable(index: number) {
    // Validate product selection
    if (!this.selectedProductDetails || this.selectedProductDetails.name === '') {
      return this.snackbar.error('Please select a product first');
    }

    // Set the product index
    this.productIndex = index;

    // Check if `productTableArray` exists and has data
    if (!this.quotationTableFormArray || this.quotationTableFormArray.length === 0) {
      return this.snackbar.error('No table data available for the selected product');
    }

    // Temporarily store the product table data in localStorage (optional)
    const productTableData = this.quotationTableFormArray.value;
    localStorage.setItem('productTable', JSON.stringify(productTableData));

    // Clear the dialog's `quotationTableFormArray` to prepare for new data
    this.quotationTableFormArray.clear();

    // Populate `quotationTableFormArray` with the selected product's table data
    productTableData.forEach((row: any) => {
      this.quotationTableFormArray.push(
        this.fb.group({
          feet: [row.feet || 0, Validators.required],
          inch: [row.inch || 0, Validators.required],
          nos: [row.nos || 0],
          rFeet: [row.rFeet || 0],
          sqFt: [row.sqFt || 0],
          weight: [row.weight || 0],
        })
      );
    });

    // Open the dialog
    this.isDialogOpen = true;
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

  private calculateItemPrice(index: number) {
    const group = this.itemsFormArray.at(index) as FormGroup;
    const values = {
      quantity: group.get('quantity')?.value || 0,
      unitPrice: group.get('unitPrice')?.value || 0,
      discountPercentage: 0,
      taxPercentage: 18 // group.get('taxPercentage')?.value
    };

    // Calculate base price
    const basePrice = values.quantity * values.unitPrice;

    // Calculate discount amount
    const discountAmount = (basePrice * values.discountPercentage) / 100;
    const afterDiscount = basePrice - discountAmount;

    // Calculate tax on discounted amount
    const taxAmount = (afterDiscount * values.taxPercentage) / 100;

    // Final price is discounted amount plus tax
    const finalPrice = afterDiscount + taxAmount;

    // Update the form control
    group.patchValue({
      finalPrice: Number(finalPrice.toFixed(2))
    }, { emitEvent: false });

    // Update total amount
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
          this.products = [ //response.data;
            {
              "purchase_amount": 30,
              "name": "JSW",
              "weight": 0.50,
              "id": 1,
              "type": "REGULAR",
              "subType": "SF",
              "sale_amount": 50
            },
            {
              "purchase_amount": 230,
              "name": "ESSAR",
              "weight": 0.60,
              "id": 2,
              "type": "REGULAR",
              "subType": "MM",
              "sale_amount": 240
            },
            {
              "purchase_amount": 15,
              "name": "POLY CARBON PRODUCT",
              "weight": null,
              "id": 3,
              "type": "POLYCARBONATE",
              "subType": "SINGLE",
              "sale_amount": 19.8
            },
            {
              "purchase_amount": 30,
              "name": "Screw",
              "weight": 0,
              "id": 4,
              "type": "NOS",
              "subType": "",
              "sale_amount": 50
            },
          ]
          console.log('all products >>>', this.products)
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

  validateDates(): void {
    const quoteDate = this.quotationForm.get('quoteDate')?.value;
    const validUntil = this.quotationForm.get('validUntil')?.value;

    if (quoteDate && validUntil && new Date(validUntil) < new Date(quoteDate)) {
      this.quotationForm.get('validUntil')?.setErrors({ invalidDate: true });
    }
  }

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
    const quotationId = this.encryptionService.decrypt(localStorage.getItem('editQuotationId') || '');
    if (quotationId) {
      this.isLoading = true;
      this.quotationService.getQuotationDetail(parseInt(quotationId)).subscribe({
        next: (response) => {
          if (response) {
            this.quotationId = parseInt(quotationId);
            this.isEdit = true;
            this.populateForm(response.data);
          }
          this.isLoading = false;
          // localStorage.removeItem('editQuotationId');
        },
        error: (error) => {
          console.error('Error loading quotation details:', error);
          this.snackbar.error('Failed to load quotation details');
          this.isLoading = false;
          localStorage.removeItem('editQuotationId');
        }
      });
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
          // todo: set productTable data
        });
        this.setupItemCalculations(itemGroup, this.itemsFormArray.length);
        this.itemsFormArray.push(itemGroup);
      });
    }
  }

  onSubmit(): void {
    console.log('onSubmit >>>>>', this.quotationForm.value)
    return
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

  downloadPDF(): void {
    const tableData = (this.quotationForm.get('items') as FormArray).at(this.productIndex).get('productTable') as FormArray
    if (!tableData.valid) {
      return this.snackbar.error('Please fill-up the table inputs')
    }
    const doc = new jsPDF();

    // Define table columns and rows
    const columns = Object.keys(tableData.value[0])
    const rows = tableData.value.map((item: any) => columns.map(col => item[col] || '')); // If field is missing, set as empty

    // Add a title to the PDF
    doc.text(this.selectedProduct, 14, 10);

    // Add the table to the PDF
    (doc as any).autoTable({
      head: [columns],
      body: rows,
      startY: 20,
    });

    // Save the PDF
    doc.save(`${this.selectedProduct} table.pdf`);
  }

}
