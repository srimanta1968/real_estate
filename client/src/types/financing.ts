export interface FinancingInfo {
  id?: string;
  property_id?: string;
  loan_amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface FinancingFormData {
  loan_amount: string;
  down_payment: string;
  interest_rate: string;
  loan_term: string;
}
