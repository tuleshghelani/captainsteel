export enum ProductMainType {
  NOS = 'Nos',
  REGULAR = 'Regular',
  POLY_CARBONATE = 'Poly Carbonate',
}

export enum ProductCalculationType {
  SQ_FEET = 'SQ_FEET',
  MM = 'MM'
}

export interface Product {
  id?: number;
  name: string;
  categoryId: number;
  categoryName?: string;
  description: string;
  minimumStock: number;
  remainingQuantity?: number;
  purchaseAmount?: number;
  saleAmount?: number;
  status: 'A' | 'I';
  blockedQuantity?: number;
  totalRemainingQuantity?: number;
  createdAt?: string;
  updatedAt?: string;
  weight: number;
  type: ProductMainType;
  calculationType?: ProductCalculationType;
}

export interface ProductSearchRequest {
  search?: string;
  categoryId?: number;
  status?: string;
  size?: number;
  page?: number;
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: {
    content: Product[];
    totalElements: number;
    totalPages: number;
  };
}