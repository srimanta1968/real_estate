import { CapRateCalculation } from '../../types/caprate';

interface CapRateDisplayProps {
  calculation: CapRateCalculation;
}

export default function CapRateDisplay({ calculation }: CapRateDisplayProps) {
  const fmt = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  function getCapRateRating(): { label: string; color: string; description: string } {
    const rate = calculation.capRate;
    if (rate >= 10) return { label: 'Excellent', color: 'text-green-700 bg-green-50 border-green-200', description: 'Strong return potential' };
    if (rate >= 7) return { label: 'Good', color: 'text-blue-700 bg-blue-50 border-blue-200', description: 'Above average return' };
    if (rate >= 5) return { label: 'Average', color: 'text-yellow-700 bg-yellow-50 border-yellow-200', description: 'Market average return' };
    if (rate >= 3) return { label: 'Below Average', color: 'text-orange-700 bg-orange-50 border-orange-200', description: 'Lower return, possibly appreciating area' };
    return { label: 'Low', color: 'text-red-700 bg-red-50 border-red-200', description: 'Consider other investments' };
  }

  const rating = getCapRateRating();

  return (
    <div className="space-y-6">
      <div className={`rounded-xl border-2 p-6 text-center ${rating.color}`}>
        <p className="text-sm font-medium uppercase tracking-wide">Cap Rate</p>
        <p className="text-5xl font-bold mt-2">{calculation.capRate.toFixed(2)}%</p>
        <p className="text-lg font-semibold mt-1">{rating.label}</p>
        <p className="text-sm mt-1 opacity-75">{rating.description}</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Calculation Breakdown</h3>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Annual Gross Rental Income</span>
            <span className="font-medium text-gray-900">{fmt(calculation.annualRentalIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Vacancy Loss ({calculation.vacancyRate}%)</span>
            <span className="font-medium text-red-600">
              -{fmt(calculation.annualRentalIncome * (calculation.vacancyRate / 100))}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="text-gray-700 font-medium">Effective Gross Income</span>
            <span className="font-medium text-gray-900">{fmt(calculation.effectiveGrossIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Annual Operating Expenses</span>
            <span className="font-medium text-red-600">-{fmt(calculation.annualExpenses)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="text-gray-700 font-medium">Net Operating Income (NOI)</span>
            <span className="font-bold text-gray-900">{fmt(calculation.netOperatingIncome)}</span>
          </div>
        </div>

        <div className="bg-indigo-50 rounded-lg p-4 text-sm">
          <p className="text-indigo-700">
            <span className="font-medium">Formula: </span>
            Cap Rate = NOI / Purchase Price = {fmt(calculation.netOperatingIncome)} / {fmt(calculation.purchasePrice)} ={' '}
            <span className="font-bold">{calculation.capRate.toFixed(2)}%</span>
          </p>
        </div>
      </div>
    </div>
  );
}
