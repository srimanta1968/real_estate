export interface CapRateInfo {
  id?: string;
  property_id?: string;
  cap_rate: number;
  created_at?: string;
  updated_at?: string;
}

export interface CapRateCalculation {
  purchasePrice: number;
  annualRentalIncome: number;
  annualExpenses: number;
  vacancyRate: number;
  effectiveGrossIncome: number;
  netOperatingIncome: number;
  capRate: number;
}
