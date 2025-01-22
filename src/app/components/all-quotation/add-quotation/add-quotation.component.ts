import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl, AbstractControl } from '@angular/forms';
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
import { animate, style, transition, trigger } from '@angular/animations';
import { ProductMainType, ProductCalculationType } from '../../../models/product.model';
import { ProductCalculationDialogComponent } from '../../../components/shared/product-calculation-dialog/product-calculation-dialog.component';

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
  selectedProduct!: string
  totals: { price: number; tax: number; finalPrice: number } = {
    price: 0,
    tax: 0,
    finalPrice: 0
  };

  get itemsFormArray() {
    return this.quotationForm.get('items') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private quotationService: QuotationService,
    private productService: ProductService,
    private customerService: CustomerService,
    private snackbar: SnackbarService,
    private encryptionService: EncryptionService,
    private router: Router,
    private dialog: Dialog,
    private cdr: ChangeDetectorRef
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
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  private createItemFormGroup(initialData?: any): FormGroup {
    return this.fb.group({
      productId: [initialData?.productId || '', Validators.required],
      productType: [initialData?.productType || ''],
      calculationType: [initialData?.calculationType || ''],
      quantity: [initialData?.quantity || 1, [Validators.required, Validators.min(1)]],
      weight: [{ value: initialData?.weight || 0, disabled: true }],
      unitPrice: [initialData?.unitPrice || 0, [Validators.required, Validators.min(0.01)]],
      discountPercentage: [initialData?.discountPercentage || 0, [Validators.required, Validators.min(0), Validators.max(100)]],
      price: [initialData?.price || 0, [Validators.required, Validators.min(0.01)]],
      taxPercentage: [{ value: 18, disabled: true }],
      finalPrice: [{ value: initialData?.finalPrice || 0, disabled: true }],
      calculations: this.fb.array(initialData.calculations.map((item:any) => this.createCalculationGroup(item)))
    });
  }


  createCalculationGroup(item: any): FormGroup {
    return this.fb.group({
      feet: [item.feet, Validators.required],
      nos: [item.nos, Validators.required],
      weight: [item.weight, Validators.required],
      id: [item?.id],
      inch: [item.inch, Validators.required],
      sqFeet: [item.sqFeet, Validators.required],
      runningFeet: [item.runningFeet, Validators.required]
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

  addItem(): void {
    const itemGroup = this.fb.group({
      productId: ['', Validators.required],
      productType: [''],
      calculationType: [''],
      weight: [0],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]],
      discountPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      price: [0],
      taxPercentage: [18],
      finalPrice: [],
      calculations: [[]]
    });
    this.setupItemCalculations(itemGroup, this.itemsFormArray.length);
    this.itemsFormArray.push(itemGroup);
    this.calculateTotalAmount();
  }

  removeItem(index: number): void {
    this.itemsFormArray.removeAt(index);
    this.calculateTotalAmount();
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
      taxPercentage: group.get('taxPercentage')?.value || 18
    };

    const basePrice = values.quantity * values.unitPrice;
    const discountAmount = (basePrice * values.discountPercentage) / 100;
    const afterDiscount = basePrice - discountAmount;
    const taxAmount = (afterDiscount * values.taxPercentage) / 100;
    const finalPrice = afterDiscount + taxAmount;

    group.patchValue({
      price: Number(afterDiscount.toFixed(2)),
      finalPrice: Number(finalPrice.toFixed(2))
    }, { emitEvent: false });

    group?.updateValueAndValidity();
    this.calculateTotalAmount();
    this.cdr.detectChanges();
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
          // console.log('All products >>>',response.data)
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
    const totals = {
      price: 0,
      tax: 0,
      finalPrice: 0
    };

    this.itemsFormArray.controls.forEach((group: AbstractControl) => {
      const price = group.get('price')?.value || 0;
      const finalPrice = group.get('finalPrice')?.value || 0;
      const taxPercentage = group.get('taxPercentage')?.value || 18;

      totals.price += price;
      totals.tax += (price * taxPercentage) / 100;
      totals.finalPrice += finalPrice;
    });

    this.totals = {
      price: Number(totals.price.toFixed(2)),
      tax: Number(totals.tax.toFixed(2)),
      finalPrice: Number(totals.finalPrice.toFixed(2))
    };
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
    const selectedProduct = this.products.find(p => p.id === event.value);
    if (!selectedProduct) return;

    const itemGroup = this.itemsFormArray.at(index);
    const calculationTypeControl = itemGroup.get('calculationType');

    itemGroup.patchValue({
      productId: selectedProduct.id,
      productType: selectedProduct.type,
      unitPrice: selectedProduct.sale_amount || 0,
      weight: selectedProduct.weight || 0,
      quantity: selectedProduct.quantity || 1,
      calculationType: ''
    });

    // Add or remove validators based on product type
    if (selectedProduct.type === 'REGULAR') {
      calculationTypeControl?.setValidators([Validators.required]);
      // itemGroup.get('quantity')?.disable();
    } else {
      calculationTypeControl?.clearValidators();
      itemGroup.get('quantity')?.enable();
    }

    calculationTypeControl?.updateValueAndValidity();
  }

  openCalculationDialog(index: number): void {
    const itemGroup = this.itemsFormArray.at(index) as FormGroup;
    const selectedProduct = this.products.find(p => p.id === itemGroup.get('productId')?.value);
    const calculationType = itemGroup.get('calculationType')?.value;

    if (!selectedProduct ||
      selectedProduct.type.toUpperCase() !== ProductMainType.REGULAR.toString().toUpperCase() ||
      !calculationType) {
      return;
    }

    const savedCalculations = itemGroup.get('calculations')?.value || [];

    if (calculationType === ProductCalculationType.MM) {
    } else if (calculationType === ProductCalculationType.SQ_FEET) {
      const dialogRef = this.dialog.open(ProductCalculationDialogComponent, {
        data: {
          product: selectedProduct,
          calculationType: calculationType,
          savedCalculations: savedCalculations
        }
      });

      dialogRef.closed.subscribe((result?: any) => {
        if (result) {
          itemGroup.patchValue({
            weight: result.totalWeight,
            quantity: Math.round(result.totalSqFeet)
          });
          itemGroup.setControl(
            'calculations', this.fb.array(result.calculations.map((item:any) => this.createCalculationGroup(item))
          ))
          itemGroup.updateValueAndValidity();
          this.itemsFormArray.updateValueAndValidity();
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
            console.log('edit response >>',response.data)
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

  async populateForm(data: any) {
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
      termsConditions: data.termsConditions || '',
      address: data.address,
      contactNumber: data.contactNumber
    });

    // Add items
    if (data.items && Array.isArray(data.items)) {
      await data.items.forEach((item: any) => {
        const itemGroup = this.createItemFormGroup({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxPercentage: item.taxPercentage,
          price: item.price,
          discountPercentage: item.discountPercentage,
          finalPrice: item.finalPrice,
          productType: item.productType,
          calculationType: item.calculationType,
          weight: item.weight,
          calculations: item.calculations
        });
        this.setupItemCalculations(itemGroup, this.itemsFormArray.length);
        this.itemsFormArray.push(itemGroup);
      });
    }
    this.calculateTotalAmount();
    this.cdr.detectChanges();
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

  onCalculationTypeChange(index: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newCalculationType = select.value;
    const itemGroup = this.itemsFormArray.at(index);
    const currentCalculationType = itemGroup.get('calculationType')?.value;

    // Only reset if calculation type actually changed
    if (currentCalculationType !== newCalculationType) {
      itemGroup.patchValue({
        weight: 0,
        quantity: 0,
        calculations: [] // Reset calculations when type changes
      });
    }

    // Only open dialog if a type is selected
    if (newCalculationType) {
      this.openCalculationDialog(index);
    }
  }

  getTotalPrice(): number {
    return this.itemsFormArray.controls
      .reduce((total, group) => total + (group.get('price')?.value || 0), 0);
  }

  getTotalTax(): number {
    return this.itemsFormArray.controls
      .reduce((total, group) => {
        const price = group.get('price')?.value || 0;
        const taxPercentage = group.get('taxPercentage')?.value || 18;
        return total + ((price * taxPercentage) / 100);
      }, 0);
  }

  getTotalFinalPrice(): number {
    return this.itemsFormArray.controls
      .reduce((total, group) => total + (group.get('finalPrice')?.value || 0), 0);
  }

  onSelectCalculationType(index:number, type: string): void {
    const itemGroup = this.itemsFormArray.at(index) as FormGroup
    itemGroup.get('calculationType')?.setValue(type);
    itemGroup.updateValueAndValidity();
    this.openCalculationDialog(index);
  }

}
