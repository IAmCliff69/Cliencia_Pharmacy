export interface TopMedicineResponse {
  medicine_id: number;
  medicine_name: string;
  total_quantity_sold: number;
  total_revenue: number;
}

export interface SalesSummaryResponse {
  start_date: string | null;
  end_date: string | null;
  total_sales: number;
  total_revenue: number;
  top_medicines: TopMedicineResponse[];
}