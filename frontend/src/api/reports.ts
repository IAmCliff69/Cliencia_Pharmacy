import api from "./axios";
import type { SalesSummaryResponse } from "../types/report";

export const getSalesSummary = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<SalesSummaryResponse> => {
  const response = await api.get<SalesSummaryResponse>(
    "/reports/sales-summary",
    { params }
  );
  return response.data;
};