export interface CategoryResponse {
  category_id: number;
  category_name: string;
  description: string | null;
}

export interface CategoryCreate {
  category_name: string;
  description?: string;
}