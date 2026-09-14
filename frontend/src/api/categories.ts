import api from "./axios";
import type { CategoryResponse, CategoryCreate } from "../types/category";

export const getCategories = async (): Promise<CategoryResponse[]> => {
  const response = await api.get<CategoryResponse[]>("/categories/");
  return response.data;
};

export const createCategory = async (
  data: CategoryCreate
): Promise<CategoryResponse> => {
  const response = await api.post<CategoryResponse>("/categories/", data);
  return response.data;
};

export const updateCategory = async (
  categoryId: number,
  data: CategoryCreate
): Promise<CategoryResponse> => {
  const response = await api.put<CategoryResponse>(
    `/categories/${categoryId}`,
    data
  );
  return response.data;
};

export const deleteCategory = async (categoryId: number): Promise<void> => {
  await api.delete(`/categories/${categoryId}`);
};