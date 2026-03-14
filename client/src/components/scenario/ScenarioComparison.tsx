import { useState, useEffect, FormEvent } from 'react';
import { Scenario, ScenarioInput } from '../../types/scenario';

interface ScenarioComparisonProps {
  baseScenario: ScenarioInput;
  annualPropertyTax: number;
  annualInsurance: number;
  annualMaintenance: number;
  managementFeePct: number;
  loanTerm: number;
  onDataChange?: (scenarios: ScenarioInput[], results: Scenario[]) => void;
}

function calculateScenario(
  input: ScenarioInput,
  annualPropertyTax: number,
  annualInsurance: number,
  annualMaintenance: number,
  managementFeePct: number,
  loanTerm: number
): Scenario {
  const purchasePrice = parseFloat(input.purchasePrice) || 0;
  const downPaymentPct = parseFloat(input.downPaymentPct) || 0;
  const interestRate = parseFloat(input.interestRate) || 0;
  const monthlyRent = parseFloat(input.monthlyRent) || 0;
  const vacancyRate = parseFloat(input.vacancyRate) || 0;

  const downPayment = purchasePrice * (downPaymentPct / 100);
  const loanAmount = purchasePrice - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = loanTerm * 12;

  let monthlyMortgage = 0;
  if (loanAmount > 0 && monthlyRate > 0) {
    monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
  }

  const annualRental = monthlyRent * 12;
  const vacLoss = annualRental * (vacancyRate / 100);
  const egi = annualRental - vacLoss;
  const mgmt = egi * (managementFeePct / 100);
  const totalExp = annualPropertyTax + annualInsurance + annualMaintenance + mgmt;
  const noi = egi - totalExp;
  const annualDebt = monthlyMortgage * 12;
  const netCashFlow = noi - annualDebt;
  const capRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
  const cocReturn = downPayment > 0 ? (netCashFlow / downPayment) * 100 : 0;

  return {
    name: input.name,
    purchasePrice,
    downPaymentPct,
    interestRate,
    monthlyRent,
    vacancyRate,
    capRate,
    cashOnCash: cocReturn,
    monthlyCashFlow: netCashFlow / 12,
    noi,
  };
}

export default function ScenarioComparison({ baseScenario, annualPropertyTax, annualInsurance, annualMaintenance, managementFeePct, loanTerm, onDataChange }: ScenarioComparisonProps) {
  const [scenarios, setScenarios] = useState<ScenarioInput[]>([
    { ...baseScenario, name: 'Base Case' },
    { ...baseScenario, name: 'Optimistic', monthlyRent: String(Math.round(parseFloat(baseScenario.monthlyRent) * 1.1)) },
    { ...baseScenario, name: 'Conservative', interestRate: String((parseFloat(baseScenario.interestRate) + 1).toFixed(2)) },
  ]);

  const [results, setResults] = useState<Scenario[]>([]);

  useEffect(() => {
    onDataChange?.(scenarios, results);
  }, [scenarios, results]);

  function handleInputChange(index: number, field: keyof ScenarioInput, value: string) {
    setScenarios((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addScenario() {
    setScenarios((prev) => [...prev, { ...baseScenario, name: `Scenario ${prev.length + 1}` }]);
  }

  function removeScenario(index: number) {
    if (scenarios.length <= 2) return;
    setScenarios((prev) => prev.filter((_, i) => i !== index));
    setResults([]);
  }

  function handleCompare(e: FormEvent) {
    e.preventDefault();
    const calculated = scenarios.map((s) =>
      calculateScenario(s, annualPropertyTax, annualInsurance, annualMaintenance, managementFeePct, loanTerm)
    );
    setResults(calculated);
  }

  const fmt = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const metricColors = ['#4f46e5', '#22c55e', '#f97316', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <form onSubmit={handleCompare} className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Parameter</th>
                {scenarios.map((s, i) => (
                  <th key={i} className="text-center py-2 px-2">
                    <input
                      value={s.name}
                      onChange={(e) => handleInputChange(i, 'name', e.target.value)}
                      className="w-full text-center font-semibold text-gray-700 border-b border-transparent hover:border-gray-300 focus:border-indigo-500 outline-none px-1 py-0.5"
                    />
                    {scenarios.length > 2 && (
                      <button type="button" onClick={() => removeScenario(i)} className="text-xs text-red-400 hover:text-red-600 ml-1">remove</button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'purchasePrice' as const, label: 'Purchase Price ($)' },
                { key: 'downPaymentPct' as const, label: 'Down Payment (%)' },
                { key: 'interestRate' as const, label: 'Interest Rate (%)' },
                { key: 'monthlyRent' as const, label: 'Monthly Rent ($)' },
                { key: 'vacancyRate' as const, label: 'Vacancy Rate (%)' },
              ].map(({ key, label }) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="py-2 px-2 text-gray-600">{label}</td>
                  {scenarios.map((s, i) => (
                    <td key={i} className="py-1 px-2">
                      <input
                        type="number"
                        step="any"
                        value={s[key]}
                        onChange={(e) => handleInputChange(i, key, e.target.value)}
                        className="w-full text-center px-2 py-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={addScenario}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            + Add Scenario
          </button>
          <button
            type="submit"
            className="flex-1 bg-indigo-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Compare Scenarios
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-2 text-gray-500 font-semibold">Metric</th>
                  {results.map((r, i) => (
                    <th key={i} className="text-center py-2 px-2 font-semibold" style={{ color: metricColors[i % metricColors.length] }}>
                      {r.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Cap Rate', render: (r: Scenario) => `${r.capRate.toFixed(2)}%` },
                  { label: 'Cash-on-Cash', render: (r: Scenario) => `${r.cashOnCash.toFixed(2)}%` },
                  { label: 'Monthly Cash Flow', render: (r: Scenario) => fmt(r.monthlyCashFlow) },
                  { label: 'Annual NOI', render: (r: Scenario) => fmt(r.noi) },
                ].map(({ label, render }) => (
                  <tr key={label} className="border-b border-gray-100">
                    <td className="py-2 px-2 text-gray-600 font-medium">{label}</td>
                    {results.map((r, i) => {
                      const values = results.map((res) => {
                        const text = render(res);
                        return parseFloat(text.replace(/[^-\d.]/g, ''));
                      });
                      const maxVal = Math.max(...values);
                      const isMax = values[i] === maxVal;
                      return (
                        <td key={i} className={`py-2 px-2 text-center ${isMax ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                          {render(r)}
                          {isMax && <span className="ml-1 text-xs text-green-500">best</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Visual Comparison</h3>
            {['Cap Rate', 'Cash-on-Cash', 'Monthly Cash Flow'].map((metricLabel) => {
              const getVal = (r: Scenario): number => {
                if (metricLabel === 'Cap Rate') return r.capRate;
                if (metricLabel === 'Cash-on-Cash') return r.cashOnCash;
                return r.monthlyCashFlow;
              };
              const maxAbs = Math.max(...results.map((r) => Math.abs(getVal(r))), 1);
              return (
                <div key={metricLabel}>
                  <p className="text-xs text-gray-500 mb-1">{metricLabel}</p>
                  <div className="space-y-1">
                    {results.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-24 truncate">{r.name}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(Math.abs(getVal(r)) / maxAbs) * 100}%`,
                              backgroundColor: metricColors[i % metricColors.length],
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium w-16 text-right">
                          {metricLabel === 'Monthly Cash Flow' ? fmt(getVal(r)) : `${getVal(r).toFixed(1)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
