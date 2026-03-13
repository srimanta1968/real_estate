export interface IrrInfo {
  id?: string;
  property_id?: string;
  irr: number;
  created_at?: string;
  updated_at?: string;
}

export interface IrrCalculation {
  initialInvestment: number;
  annualCashFlows: number[];
  exitValue: number;
  holdingPeriod: number;
  irr: number;
  totalReturn: number;
  equityMultiple: number;
}

export interface IrrInputData {
  holdingPeriod: string;
  annualAppreciation: string;
  sellingCosts: string;
  rentGrowthRate: string;
  expenseGrowthRate: string;
}
