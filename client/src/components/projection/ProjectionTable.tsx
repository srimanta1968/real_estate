import { useState, FormEvent } from 'react';
import { AnnualProjectionRow, ProjectionInputs } from '../../types/projection';

interface ProjectionTableProps {
  purchasePrice: number;
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  monthlyRental: number;
  vacancyRate: number;
  annualPropertyTax: number;
  annualInsurance: number;
  annualMaintenance: number;
  managementFeePct: number;
}

export default function ProjectionTable(props: ProjectionTableProps) {
  const [inputs, setInputs] = useState<ProjectionInputs>({
    rentGrowthRate: 2,
    expenseGrowthRate: 2,
    appreciationRate: 3,
    holdingPeriod: 10,
  });
  const [projections, setProjections] = useState<AnnualProjectionRow[]>([]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  }

  function generateProjections(e: FormEvent) {
    e.preventDefault();

    const { purchasePrice, downPayment, loanAmount, interestRate, loanTerm, monthlyRental, vacancyRate, annualPropertyTax, annualInsurance, annualMaintenance, managementFeePct } = props;
    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = loanTerm * 12;

    let monthlyMortgage = 0;
    if (loanAmount > 0 && monthlyRate > 0) {
      monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
    }
    const annualDebtService = monthlyMortgage * 12;

    const rows: AnnualProjectionRow[] = [];
    let currentRental = monthlyRental * 12;
    let currentPropertyTax = annualPropertyTax;
    let currentInsurance = annualInsurance;
    let currentMaintenance = annualMaintenance;

    for (let year = 1; year <= inputs.holdingPeriod; year++) {
      if (year > 1) {
        currentRental *= 1 + inputs.rentGrowthRate / 100;
        currentPropertyTax *= 1 + inputs.expenseGrowthRate / 100;
        currentInsurance *= 1 + inputs.expenseGrowthRate / 100;
        currentMaintenance *= 1 + inputs.expenseGrowthRate / 100;
      }

      const vacLoss = currentRental * (vacancyRate / 100);
      const egi = currentRental - vacLoss;
      const mgmt = egi * (managementFeePct / 100);
      const totalExp = currentPropertyTax + currentInsurance + currentMaintenance + mgmt;
      const noi = egi - totalExp;
      const cashFlow = noi - annualDebtService;
      const propertyValue = purchasePrice * Math.pow(1 + inputs.appreciationRate / 100, year);

      const paymentsMade = year * 12;
      let loanBalance = 0;
      if (loanAmount > 0 && monthlyRate > 0) {
        loanBalance = loanAmount * (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, paymentsMade)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
      }
      const equity = propertyValue - loanBalance;
      const cocReturn = downPayment > 0 ? (cashFlow / downPayment) * 100 : 0;

      rows.push({
        year,
        grossRental: currentRental,
        vacancyLoss: vacLoss,
        effectiveIncome: egi,
        totalExpenses: totalExp,
        noi,
        debtService: annualDebtService,
        cashFlow,
        propertyValue,
        equity,
        cashOnCash: cocReturn,
      });
    }

    setProjections(rows);
  }

  const fmt = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <form onSubmit={generateProjections} className="grid grid-cols-4 gap-4">
        <div>
          <label htmlFor="rentGrowthRate" className="block text-xs font-medium text-gray-600 mb-1">
            Rent Growth (%)
          </label>
          <input
            id="rentGrowthRate"
            name="rentGrowthRate"
            type="number"
            step="0.5"
            value={inputs.rentGrowthRate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label htmlFor="expenseGrowthRate" className="block text-xs font-medium text-gray-600 mb-1">
            Expense Growth (%)
          </label>
          <input
            id="expenseGrowthRate"
            name="expenseGrowthRate"
            type="number"
            step="0.5"
            value={inputs.expenseGrowthRate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label htmlFor="appreciationRate" className="block text-xs font-medium text-gray-600 mb-1">
            Appreciation (%)
          </label>
          <input
            id="appreciationRate"
            name="appreciationRate"
            type="number"
            step="0.5"
            value={inputs.appreciationRate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label htmlFor="holdingPeriod" className="block text-xs font-medium text-gray-600 mb-1">
            Years
          </label>
          <div className="flex gap-2">
            <input
              id="holdingPeriod"
              name="holdingPeriod"
              type="number"
              min="1"
              max="30"
              value={inputs.holdingPeriod}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              Generate
            </button>
          </div>
        </div>
      </form>

      {projections.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 px-2 text-gray-500 font-semibold">Year</th>
                <th className="text-right py-2 px-2 text-gray-500 font-semibold">Gross Rent</th>
                <th className="text-right py-2 px-2 text-gray-500 font-semibold">NOI</th>
                <th className="text-right py-2 px-2 text-gray-500 font-semibold">Cash Flow</th>
                <th className="text-right py-2 px-2 text-gray-500 font-semibold">Property Value</th>
                <th className="text-right py-2 px-2 text-gray-500 font-semibold">Equity</th>
                <th className="text-right py-2 px-2 text-gray-500 font-semibold">CoC Return</th>
              </tr>
            </thead>
            <tbody>
              {projections.map((row) => (
                <tr key={row.year} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2 font-medium text-gray-700">{row.year}</td>
                  <td className="py-2 px-2 text-right text-gray-600">{fmt(row.grossRental)}</td>
                  <td className="py-2 px-2 text-right text-gray-600">{fmt(row.noi)}</td>
                  <td className={`py-2 px-2 text-right font-medium ${row.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fmt(row.cashFlow)}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-600">{fmt(row.propertyValue)}</td>
                  <td className="py-2 px-2 text-right text-indigo-600 font-medium">{fmt(row.equity)}</td>
                  <td className={`py-2 px-2 text-right font-medium ${row.cashOnCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.cashOnCash.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 font-semibold">
                <td className="py-2 px-2 text-gray-700">Total</td>
                <td className="py-2 px-2 text-right text-gray-700">
                  {fmt(projections.reduce((s, r) => s + r.grossRental, 0))}
                </td>
                <td className="py-2 px-2 text-right text-gray-700">
                  {fmt(projections.reduce((s, r) => s + r.noi, 0))}
                </td>
                <td className="py-2 px-2 text-right text-green-700">
                  {fmt(projections.reduce((s, r) => s + r.cashFlow, 0))}
                </td>
                <td className="py-2 px-2 text-right text-gray-400">-</td>
                <td className="py-2 px-2 text-right text-gray-400">-</td>
                <td className="py-2 px-2 text-right text-gray-400">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
