export interface AnnualProjectionInfo {
  id?: string;
  property_id?: string;
  year: number;
  rental_income: number;
  created_at?: string;
  updated_at?: string;
}

export interface AnnualProjectionRow {
  year: number;
  grossRental: number;
  vacancyLoss: number;
  effectiveIncome: number;
  totalExpenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  propertyValue: number;
  equity: number;
  cashOnCash: number;
}

export interface ProjectionInputs {
  rentGrowthRate: number;
  expenseGrowthRate: number;
  appreciationRate: number;
  holdingPeriod: number;
}
