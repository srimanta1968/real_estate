import { MetricCard, BarChartData } from '../../types/visualization';

interface MetricsDashboardProps {
  metrics: MetricCard[];
  incomeBreakdown: BarChartData[];
  expenseBreakdown: BarChartData[];
}

const ratingColors: Record<MetricCard['rating'], string> = {
  excellent: 'border-green-400 bg-green-50',
  good: 'border-blue-400 bg-blue-50',
  average: 'border-yellow-400 bg-yellow-50',
  poor: 'border-red-400 bg-red-50',
  neutral: 'border-gray-300 bg-gray-50',
};

const ratingDotColors: Record<MetricCard['rating'], string> = {
  excellent: 'bg-green-500',
  good: 'bg-blue-500',
  average: 'bg-yellow-500',
  poor: 'bg-red-500',
  neutral: 'bg-gray-400',
};

function BarChart({ data, title }: { data: BarChartData[]; title: string }) {
  const maxValue = Math.max(...data.map((d) => Math.abs(d.value)), 1);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-28 text-right truncate">{item.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(Math.abs(item.value) / maxValue) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 w-20 text-right">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MetricsDashboard({ metrics, incomeBreakdown, expenseBreakdown }: MetricsDashboardProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Key Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.name}
              className={`rounded-xl border-2 p-4 ${ratingColors[metric.rating]}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${ratingDotColors[metric.rating]}`} />
                <span className="text-xs font-medium text-gray-500 uppercase">{metric.name}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {incomeBreakdown.length > 0 && (
          <BarChart data={incomeBreakdown} title="Income Breakdown (Annual)" />
        )}
        {expenseBreakdown.length > 0 && (
          <BarChart data={expenseBreakdown} title="Expense Breakdown (Annual)" />
        )}
      </div>
    </div>
  );
}
