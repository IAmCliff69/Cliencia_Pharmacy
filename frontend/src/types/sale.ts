export interface SaleItemResponse {
  sale_item_id: number;
  medicine_id: number;
  quantity: number;
  price: number;
}

export interface SaleResponse {
  sale_id: number;
  user_id: number;
  customer_name: string | null;
  sale_date: string; // ISO datetime
  total_amount: number;
  is_voided: boolean;
  voided_at: string | null;
  items: SaleItemResponse[];
}

export interface SaleItemCreate {
  medicine_id: number;
  quantity: number;
}

export interface SaleCreate {
  customer_name?: string;
  items: SaleItemCreate[];
}