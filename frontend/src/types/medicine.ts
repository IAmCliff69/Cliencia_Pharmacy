// Mirrors schemas.py: MedicineCreate, MedicineResponse, InventoryResponse, MedicineWithStockResponse

export interface InventoryResponse {
  inventory_id: number;
  medicine_id: number;
  quantity_available: number;
  minimum_stock_level: number;
  last_updated: string; // ISO datetime string
}

export interface MedicineResponse {
  medicine_id: number;
  medicine_name: string;
  category_id: number;
  supplier_id: number;
  description: string;
  unit_price: number;
  expiry_date: string; // ISO date string
}

export interface MedicineWithStockResponse extends MedicineResponse {
  inventory: InventoryResponse | null;
}

export interface MedicineCreate {
  medicine_name: string;
  category_id: number;
  supplier_id: number;
  description: string;
  unit_price: number;
  expiry_date: string;
  initial_quantity?: number; // defaults to 0 server-side
  minimum_stock_level?: number; // defaults to 10 server-side
}