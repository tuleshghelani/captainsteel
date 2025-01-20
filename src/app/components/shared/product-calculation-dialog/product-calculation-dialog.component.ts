import { Component, Input, Output, EventEmitter, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Product, ProductCalculationType } from '../../../models/product.model';
import { ProductCalculation, ProductCalculationTotal } from '../../../models/product-calculation.model';
import { CommonModule } from '@angular/common';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'app-product-calculation-dialog',
  templateUrl: './product-calculation-dialog.component.html',
  styleUrls: ['./product-calculation-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class ProductCalculationDialogComponent {
  product: Product;
  calculationType: ProductCalculationType;
  
  calculationForm!: FormGroup;
  totals: ProductCalculationTotal = {
    totalFeet: 0,
    totalInch: 0,
    totalNos: 0,
    totalRunningFeet: 0,
    totalSqFeet: 0,
    totalWeight: 0
  };

  constructor(
    private fb: FormBuilder,
    private dialogRef: DialogRef<ProductCalculationTotal>,
    @Inject(DIALOG_DATA) public data: { product: Product; calculationType: ProductCalculationType }
  ) {
    this.product = data.product;
    this.calculationType = data.calculationType;
    this.initForm();
  }

  private initForm(): void {
    this.calculationForm = this.fb.group({
      calculations: this.fb.array([])
    });
    this.addRow();
  }

  get calculationsArray(): FormArray {
    return this.calculationForm.get('calculations') as FormArray;
  }

  addRow(): void {
    const row = this.fb.group({
      feet: [0, [Validators.required, Validators.min(0)]],
      inch: [0, [Validators.required, Validators.min(0)]],
      nos: [1, [Validators.required, Validators.min(1)]],
      runningFeet: [{value: 0, disabled: true}],
      sqFeet: [{value: 0, disabled: true}],
      weight: [{value: 0, disabled: true}]
    });

    row.valueChanges.subscribe(() => this.calculateRow(this.calculationsArray.length - 1));
    this.calculationsArray.push(row);
  }

  removeRow(index: number): void {
    this.calculationsArray.removeAt(index);
    this.calculateTotals();
  }

  private calculateRow(index: number): void {
    const row = this.calculationsArray.at(index);
    const feet = row.get('feet')?.value || 0;
    const inch = row.get('inch')?.value || 0;
    const nos = row.get('nos')?.value || 1;

    // Convert to inches and back to feet
    const totalInches = (feet * 12) + inch;
    const runningFeet = (totalInches / 12) * nos;
    const sqFeet = runningFeet * 3.5;
    const weight = runningFeet * this.product.weight;

    row.patchValue({
      runningFeet: Number(runningFeet.toFixed(2)),
      sqFeet: Number(sqFeet.toFixed(2)),
      weight: Number(weight.toFixed(2))
    }, { emitEvent: false });

    this.calculateTotals();
  }

  private calculateTotals(): void {
    this.totals = this.calculationsArray.controls.reduce((acc, control) => {
      const values = control.value;
      return {
        totalFeet: acc.totalFeet + (values.feet || 0),
        totalInch: acc.totalInch + (values.inch || 0),
        totalNos: acc.totalNos + (values.nos || 0),
        totalRunningFeet: acc.totalRunningFeet + (control.get('runningFeet')?.value || 0),
        totalSqFeet: acc.totalSqFeet + (control.get('sqFeet')?.value || 0),
        totalWeight: acc.totalWeight + (control.get('weight')?.value || 0)
      };
    }, {
      totalFeet: 0,
      totalInch: 0,
      totalNos: 0,
      totalRunningFeet: 0,
      totalSqFeet: 0,
      totalWeight: 0
    });
  }

  onSave(): void {
    if (this.calculationForm.valid) {
      this.dialogRef.close(this.totals);
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
} 