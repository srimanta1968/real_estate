export interface FinancialVisualizationInfo {
  id?: string;
  property_id?: string;
  metric_name: string;
  value: number;
  created_at?: string;
  updated_at?: string;
}

export interface MetricCard {
  name: string;
  value: string;
  subtitle: string;
  rating: 'excellent' | 'good' | 'average' | 'poor' | 'neutral';
}

export interface BarChartData {
  label: string;
  value: number;
  color: string;
}
