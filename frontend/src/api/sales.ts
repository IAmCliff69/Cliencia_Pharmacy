import api from "./axios";
import type { SaleCreate, SaleResponse } from "../types/sale";

export const createSale = async (data: SaleCreate): Promise<SaleResponse> => {
  const response = await api.post<SaleResponse>("/sales/", data);
  return response.data;
};

export const getSales = async (params?: {
  search?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}): Promise<SaleResponse[]> => {
  const response = await api.get<SaleResponse[]>("/sales/", { params });
  return response.data;
};

export const getSale = async (saleId: number): Promise<SaleResponse> => {
  const response = await api.get<SaleResponse>(`/sales/${saleId}`);
  return response.data;
};

export const voidSale = async (saleId: number): Promise<SaleResponse> => {
  const response = await api.patch<SaleResponse>(`/sales/${saleId}/void`);
  return response.data;
};