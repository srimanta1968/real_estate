export interface ScenarioComparisonInfo {
  id?: string;
  property_id?: string;
  scenario_type: string;
  comparison_value: number;
  created_at?: string;
  updated_at?: string;
}

export interface Scenario {
  name: string;
  purchasePrice: number;
  downPaymentPct: number;
  interestRate: number;
  monthlyRent: number;
  vacancyRate: number;
  capRate: number;
  cashOnCash: number;
  monthlyCashFlow: number;
  noi: number;
}

export interface ScenarioInput {
  name: string;
  purchasePrice: string;
  downPaymentPct: string;
  interestRate: string;
  monthlyRent: string;
  vacancyRate: string;
}
