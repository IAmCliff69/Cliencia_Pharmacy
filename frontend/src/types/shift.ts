export interface ShiftResponse {
  shift_id: number;
  user_id: number;
  opened_at: string;
  closed_at: string | null;
  status: "open" | "closed";
}

export interface ShiftSummaryResponse {
  shift_id: number;
  user_id: number;
  user_name: string;
  opened_at: string;
  closed_at: string | null;
  status: "open" | "closed";
  total_sales: number;
  total_revenue: number;
}