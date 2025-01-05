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
  createdAt?: string;
  updatedAt?: string;
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