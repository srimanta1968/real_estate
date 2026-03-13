export interface CashFlowInfo {
  id?: string;
  property_id?: string;
  cash_flow: number;
  created_at?: string;
  updated_at?: string;
}

export interface CashFlowBreakdown {
  grossRentalIncome: number;
  vacancyLoss: number;
  effectiveGrossIncome: number;
  propertyTax: number;
  insurance: number;
  maintenance: number;
  managementFee: number;
  totalExpenses: number;
  netOperatingIncome: number;
  mortgagePayment: number;
  netCashFlow: number;
  cashOnCashReturn: number;
}
