import { CashFlowBreakdown } from '../../types/cashflow';

interface CashFlowDisplayProps {
  monthly: CashFlowBreakdown;
  annual: CashFlowBreakdown;
  downPayment: number;
}

export default function CashFlowDisplay({ monthly, annual, downPayment }: CashFlowDisplayProps) {
  const fmt = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const fmtDetailed = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);

  function getCashFlowRating(cocReturn: number): { label: string; color: string } {
    if (cocReturn >= 12) return { label: 'Excellent', color: 'text-green-700 bg-green-50 border-green-200' };
    if (cocReturn >= 8) return { label: 'Good', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (cocReturn >= 5) return { label: 'Average', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
    if (cocReturn >= 0) return { label: 'Low', color: 'text-orange-700 bg-orange-50 border-orange-200' };
    return { label: 'Negative', color: 'text-red-700 bg-red-50 border-red-200' };
  }

  const rating = getCashFlowRating(annual.cashOnCashReturn);

  interface LineItemProps {
    label: string;
    monthly: number;
    annual: number;
    isSubtract?: boolean;
    isBold?: boolean;
    isTotal?: boolean;
  }

  function LineItem({ label, monthly: m, annual: a, isSubtract, isBold, isTotal }: LineItemProps) {
    const textClass = isBold ? 'font-semibold text-gray-900' : 'text-gray-600';
    const borderClass = isTotal ? 'border-t-2 border-gray-300 pt-2' : '';
    const valueColor = isSubtract ? 'text-red-600' : (isBold || isTotal) ? 'text-gray-900 font-semibold' : 'text-gray-700';

    return (
      <div className={`grid grid-cols-3 gap-4 py-1 ${borderClass}`}>
        <span className={textClass}>{label}</span>
        <span className={`text-right ${valueColor}`}>
          {isSubtract ? '-' : ''}{fmtDetailed(Math.abs(m))}
        </span>
        <span className={`text-right ${valueColor}`}>
          {isSubtract ? '-' : ''}{fmt(Math.abs(a))}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`rounded-xl border-2 p-6 text-center ${rating.color}`}>
        <p className="text-sm font-medium uppercase tracking-wide">Cash-on-Cash Return</p>
        <p className="text-5xl font-bold mt-2">{annual.cashOnCashReturn.toFixed(2)}%</p>
        <p className="text-lg font-semibold mt-1">{rating.label}</p>
        <p className="text-sm mt-2 opacity-75">
          Net Annual Cash Flow {fmt(annual.netCashFlow)} on {fmt(downPayment)} invested
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Monthly Cash Flow</p>
          <p className={`text-2xl font-bold ${monthly.netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {fmtDetailed(monthly.netCashFlow)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Annual Cash Flow</p>
          <p className={`text-2xl font-bold ${annual.netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {fmt(annual.netCashFlow)}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-3 gap-4 pb-2 mb-2 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-500 uppercase">Item</span>
          <span className="text-sm font-semibold text-gray-500 uppercase text-right">Monthly</span>
          <span className="text-sm font-semibold text-gray-500 uppercase text-right">Annual</span>
        </div>

        <div className="space-y-0.5">
          <LineItem label="Gross Rental Income" monthly={monthly.grossRentalIncome} annual={annual.grossRentalIncome} isBold />
          <LineItem label="Vacancy Loss" monthly={monthly.vacancyLoss} annual={annual.vacancyLoss} isSubtract />
          <LineItem label="Effective Gross Income" monthly={monthly.effectiveGrossIncome} annual={annual.effectiveGrossIncome} isBold isTotal />

          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Operating Expenses</p>
          </div>
          <LineItem label="Property Tax" monthly={monthly.propertyTax} annual={annual.propertyTax} isSubtract />
          <LineItem label="Insurance" monthly={monthly.insurance} annual={annual.insurance} isSubtract />
          <LineItem label="Maintenance" monthly={monthly.maintenance} annual={annual.maintenance} isSubtract />
          <LineItem label="Management Fee" monthly={monthly.managementFee} annual={annual.managementFee} isSubtract />
          <LineItem label="Total Expenses" monthly={monthly.totalExpenses} annual={annual.totalExpenses} isBold isTotal />

          <LineItem label="Net Operating Income" monthly={monthly.netOperatingIncome} annual={annual.netOperatingIncome} isBold isTotal />
          <LineItem label="Mortgage Payment" monthly={monthly.mortgagePayment} annual={annual.mortgagePayment} isSubtract />
          <LineItem label="Net Cash Flow" monthly={monthly.netCashFlow} annual={annual.netCashFlow} isBold isTotal />
        </div>
      </div>
    </div>
  );
}
