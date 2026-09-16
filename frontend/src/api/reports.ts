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

export const downloadSalesReportPdf = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<Blob> => {
  const response = await api.get<Blob>("/reports/sales-pdf", {
    params,
    responseType: "blob",
  });
  return response.data;
};

export const downloadShiftReportPdf = async (shiftId: number): Promise<Blob> => {
  const response = await api.get<Blob>(`/reports/shift-pdf/${shiftId}`, {
    responseType: "blob",
  });
  return response.data;
};