import api from "./axios";
import type { MedicineWithStockResponse, MedicineCreate } from "../types/medicine";

export const getMedicines = async (params?: {
  name?: string;
  category_id?: number;
  supplier_id?: number;
  skip?: number;
  limit?: number;
}): Promise<MedicineWithStockResponse[]> => {
  const response = await api.get<MedicineWithStockResponse[]>("/medicines/", {
    params,
  });
  return response.data;
};

export const getMedicine = async (
  medicineId: number
): Promise<MedicineWithStockResponse> => {
  const response = await api.get<MedicineWithStockResponse>(
    `/medicines/${medicineId}`
  );
  return response.data;
};

export const createMedicine = async (
  data: MedicineCreate
): Promise<MedicineWithStockResponse> => {
  const response = await api.post<MedicineWithStockResponse>("/medicines/", data);
  return response.data;
};

export const updateMedicine = async (
  medicineId: number,
  data: MedicineCreate
): Promise<MedicineWithStockResponse> => {
  const response = await api.put<MedicineWithStockResponse>(
    `/medicines/${medicineId}`,
    data
  );
  return response.data;
};

export const adjustStock = async (
  medicineId: number,
  change: number
): Promise<MedicineWithStockResponse> => {
  const response = await api.patch<MedicineWithStockResponse>(
    `/medicines/${medicineId}/stock`,
    null,
    { params: { change } }
  );
  return response.data;
};

export const deleteMedicine = async (medicineId: number): Promise<void> => {
  await api.delete(`/medicines/${medicineId}`);
};

export const getLowStockMedicines = async (): Promise<MedicineWithStockResponse[]> => {
  const response = await api.get<MedicineWithStockResponse[]>("/medicines/low-stock");
  return response.data;
};

export const getExpiringMedicines = async (
  days = 30
): Promise<MedicineWithStockResponse[]> => {
  const response = await api.get<MedicineWithStockResponse[]>(
    "/medicines/expiring-soon",
    { params: { days } }
  );
  return response.data;
};

export const getExpiredMedicines = async (): Promise<MedicineWithStockResponse[]> => {
  const response = await api.get<MedicineWithStockResponse[]>("/medicines/expired");
  return response.data;
};