export interface SupplierResponse {
  supplier_id: number;
  supplier_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
}

export interface SupplierCreate {
  supplier_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
}