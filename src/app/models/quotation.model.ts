export interface QuotationSearchRequest {
    currentPage: number;
    perPageRecord: number;
    search?: string;
    categoryId?: number;
    productId?: number;
}

export interface QuotationResponse {
  content: any[];
  totalElements: number;
  totalPages: number;
}