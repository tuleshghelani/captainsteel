import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Product } from '../../../models/product.model';
import { ProductCalculationService } from '../../../services/product-calculation.service';

@Component({
  selector: 'app-product-mm-calculation-dialog',
  templateUrl: './product-mm-calculation-dialog.component.html',
  styleUrls: ['./product-mm-calculation-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ProductMMCalculationDialogComponent {
  @Input() product!: Product;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  calculationForm!: FormGroup;
  totals = {
    totalLength: 0,
    totalWidth: 0,
    totalNos: 0,
    totalSqMM: 0,
    totalSqFeet: 0,
    totalWeight: 0
  };

  constructor(
    private fb: FormBuilder,
    private calculationService: ProductCalculationService
  ) {
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
      length: [0, [Validators.required, Validators.min(0)]],
      width: [0, [Validators.required, Validators.min(0)]],
      nos: [1, [Validators.required, Validators.min(1)]],
      sqMM: [{value: 0, disabled: true}],
      sqFeet: [{value: 0, disabled: true}],
      weight: [{value: 0, disabled: true}]
    });

    row.valueChanges.subscribe(() => this.calculateRow(this.calculationsArray.length - 1));
    this.calculationsArray.push(row);
  }

  removeRow(index: number): void {
    if (this.calculationsArray.length > 1) {
      this.calculationsArray.removeAt(index);
      this.calculateTotals();
    }
  }

  private calculateRow(index: number): void {
    const row = this.calculationsArray.at(index);
    const length = row.get('length')?.value || 0;
    const width = row.get('width')?.value || 0;
    const nos = row.get('nos')?.value || 1;

    const sqMM = length * width * nos;
    const sqFeet = this.calculationService.convertMMToSqFeet(sqMM);
    const weight = sqFeet * (this.product.weight || 0);

    row.patchValue({
      sqMM: Number(sqMM.toFixed(2)),
      sqFeet: Number(sqFeet.toFixed(2)),
      weight: Number(weight.toFixed(2))
    }, { emitEvent: false });

    this.calculateTotals();
  }

  private calculateTotals(): void {
    this.totals = this.calculationsArray.controls.reduce((acc, control) => {
      const values = control.value;
      const sqMM = control.get('sqMM')?.value || 0;
      const sqFeet = control.get('sqFeet')?.value || 0;
      const weight = control.get('weight')?.value || 0;

      return {
        totalLength: acc.totalLength + (values.length || 0),
        totalWidth: acc.totalWidth + (values.width || 0),
        totalNos: acc.totalNos + (values.nos || 0),
        totalSqMM: acc.totalSqMM + sqMM,
        totalSqFeet: acc.totalSqFeet + sqFeet,
        totalWeight: acc.totalWeight + weight
      };
    }, {
      totalLength: 0,
      totalWidth: 0,
      totalNos: 0,
      totalSqMM: 0,
      totalSqFeet: 0,
      totalWeight: 0
    });
  }

  onSave(): void {
    if (this.calculationForm.valid) {
      this.save.emit({
        ...this.totals,
        calculations: this.calculationForm.value.calculations
      });
    }
  }
} 