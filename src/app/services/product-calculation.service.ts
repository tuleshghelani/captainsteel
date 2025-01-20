import { Injectable } from '@angular/core';
import { ProductCalculation, ProductCalculationTotal } from '../models/product-calculation.model';

@Injectable({
  providedIn: 'root'
})
export class ProductCalculationService {
  MM_TO_FEET_CONVERSION = 304.8; // 1 foot = 304.8 mm

  calculateRunningFeet(feet: number, inch: number, nos: number): number {
    const totalInches = (feet * 12) + inch;
    return (totalInches / 12) * nos;
  }

  calculateSqFeet(runningFeet: number): number {
    return runningFeet * 3.5;
  }

  calculateWeight(runningFeet: number, productWeight: number): number {
    return runningFeet * productWeight;
  }

  calculateTotals(calculations: ProductCalculation[]): ProductCalculationTotal {
    return calculations.reduce((acc, curr) => ({
      totalFeet: acc.totalFeet + curr.feet,
      totalInch: acc.totalInch + curr.inch,
      totalNos: acc.totalNos + curr.nos,
      totalRunningFeet: acc.totalRunningFeet + curr.runningFeet,
      totalSqFeet: acc.totalSqFeet + curr.sqFeet,
      totalWeight: acc.totalWeight + curr.weight
    }), {
      totalFeet: 0,
      totalInch: 0,
      totalNos: 0,
      totalRunningFeet: 0,
      totalSqFeet: 0,
      totalWeight: 0
    });
  }

  convertMMToSqFeet(sqMM: number): number {
    return sqMM / (this.MM_TO_FEET_CONVERSION * this.MM_TO_FEET_CONVERSION);
  }

  convertSqFeetToMM(sqFeet: number): number {
    return sqFeet * (this.MM_TO_FEET_CONVERSION * this.MM_TO_FEET_CONVERSION);
  }
} 