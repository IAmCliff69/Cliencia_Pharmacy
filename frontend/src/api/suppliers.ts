import api from "./axios";
import type { SupplierResponse, SupplierCreate } from "../types/supplier";

export const getSuppliers = async (params?: { search?: string; skip?: number; limit?: number }): Promise<SupplierResponse[]> => {
  const response = await api.get<SupplierResponse[]>("/suppliers/", { params });
  return response.data;
};

export const createSupplier = async (
  data: SupplierCreate
): Promise<SupplierResponse> => {
  const response = await api.post<SupplierResponse>("/suppliers/", data);
  return response.data;
};

export const updateSupplier = async (
  supplierId: number,
  data: SupplierCreate
): Promise<SupplierResponse> => {
  const response = await api.put<SupplierResponse>(
    `/suppliers/${supplierId}`,
    data
  );
  return response.data;
};

export const deleteSupplier = async (supplierId: number): Promise<void> => {
  await api.delete(`/suppliers/${supplierId}`);
};