export interface ExpenseInfo {
  id?: string;
  property_id?: string;
  property_tax: number;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseFormData {
  property_tax: string;
  insurance: string;
  maintenance: string;
  management_fee: string;
  vacancy_rate: string;
  monthly_rental_income: string;
}
