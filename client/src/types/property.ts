export interface PropertyInfo {
  id?: string;
  address: string;
  purchase_price: number;
  created_at?: string;
  updated_at?: string;
}

export interface PropertyInfoFormData {
  address: string;
  purchase_price: string;
}
