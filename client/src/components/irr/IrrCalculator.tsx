import { useState, useEffect, FormEvent } from 'react';
import { IrrCalculation, IrrInputData } from '../../types/irr';

interface IrrCalculatorProps {
  purchasePrice: number;
  downPayment: number;
  annualNOI: number;
  annualDebtService: number;
  onCalculate?: (result: IrrCalculation) => void;
}

function calculateIRR(cashFlows: number[], guess: number = 0.1): number {
  const maxIterations = 1000;
  const tolerance = 0.00001;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + rate, j);
      dnpv -= (j * cashFlows[j]) / Math.pow(1 + rate, j + 1);
    }
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < tolerance) return newRate;
    rate = newRate;
  }
  return rate;
}

export default function IrrCalculator({ purchasePrice, downPayment, annualNOI, annualDebtService, onCalculate }: IrrCalculatorProps) {
  const [inputs, setInputs] = useState<IrrInputData>({
    holdingPeriod: '10',
    annualAppreciation: '3',
    sellingCosts: '6',
    rentGrowthRate: '2',
    expenseGrowthRate: '2',
  });
  const [result, setResult] = useState<IrrCalculation | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof IrrInputData, string>>>({});

  function validate(): boolean {
    const newErrors: Partial<Record<keyof IrrInputData, string>> = {};
    const hp = parseInt(inputs.holdingPeriod);
    if (isNaN(hp) || hp < 1 || hp > 30) newErrors.holdingPeriod = 'Must be between 1 and 30 years';
    const aa = parseFloat(inputs.annualAppreciation);
    if (isNaN(aa) || aa < -10 || aa > 20) newErrors.annualAppreciation = 'Must be between -10% and 20%';
    const sc = parseFloat(inputs.sellingCosts);
    if (isNaN(sc) || sc < 0 || sc > 20) newErrors.sellingCosts = 'Must be between 0% and 20%';
    const rg = parseFloat(inputs.rentGrowthRate);
    if (isNaN(rg) || rg < -5 || rg > 15) newErrors.rentGrowthRate = 'Must be between -5% and 15%';
    const eg = parseFloat(inputs.expenseGrowthRate);
    if (isNaN(eg) || eg < -5 || eg > 15) newErrors.expenseGrowthRate = 'Must be between -5% and 15%';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof IrrInputData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleCalculate(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const holdingPeriod = parseInt(inputs.holdingPeriod);
    const appreciation = parseFloat(inputs.annualAppreciation) / 100;
    const sellingCostsPct = parseFloat(inputs.sellingCosts) / 100;
    const rentGrowth = parseFloat(inputs.rentGrowthRate) / 100;
    const expenseGrowth = parseFloat(inputs.expenseGrowthRate) / 100;

    const initialInvestment = -downPayment;
    const annualCashFlows: number[] = [];
    let currentNOI = annualNOI;

    for (let year = 1; year <= holdingPeriod; year++) {
      if (year > 1) {
        const prevRent = currentNOI + annualDebtService;
        const growthRent = prevRent * rentGrowth;
        const growthExpense = (prevRent - currentNOI) * expenseGrowth;
        currentNOI = currentNOI + growthRent - growthExpense;
      }
      const cashFlow = currentNOI - annualDebtService;
      annualCashFlows.push(cashFlow);
    }

    const exitValue = purchasePrice * Math.pow(1 + appreciation, holdingPeriod) * (1 - sellingCostsPct);
    const financingStored = sessionStorage.getItem('financingInfo');
    let loanBalance = 0;
    if (financingStored) {
      const fData = JSON.parse(financingStored);
      const loanAmount = parseFloat(fData.loan_amount);
      const rate = parseFloat(fData.interest_rate) / 100 / 12;
      const totalPayments = parseInt(fData.loan_term) * 12;
      const paymentsMade = holdingPeriod * 12;
      if (!isNaN(loanAmount) && !isNaN(rate) && rate > 0) {
        loanBalance = loanAmount * (Math.pow(1 + rate, totalPayments) - Math.pow(1 + rate, paymentsMade)) / (Math.pow(1 + rate, totalPayments) - 1);
      }
    }

    const netSaleProceeds = exitValue - loanBalance;
    const lastYearCashFlow = annualCashFlows[annualCashFlows.length - 1];
    annualCashFlows[annualCashFlows.length - 1] = lastYearCashFlow + netSaleProceeds;

    const allCashFlows = [initialInvestment, ...annualCashFlows];
    const irr = calculateIRR(allCashFlows) * 100;

    const totalCashReceived = annualCashFlows.reduce((sum, cf) => sum + cf, 0);
    const totalReturn = totalCashReceived + downPayment;
    const equityMultiple = totalCashReceived / downPayment;

    const calc: IrrCalculation = {
      initialInvestment: downPayment,
      annualCashFlows,
      exitValue,
      holdingPeriod,
      irr: isNaN(irr) ? 0 : irr,
      totalReturn,
      equityMultiple,
    };

    setResult(calc);
    if (onCalculate) onCalculate(calc);
  }

  useEffect(() => {
    if (purchasePrice > 0 && downPayment > 0 && annualNOI !== 0) {
      const syntheticEvent = { preventDefault: () => {} } as FormEvent;
      handleCalculate(syntheticEvent);
    }
  }, []);

  const fmt = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  function getIrrRating(irr: number): { label: string; color: string } {
    if (irr >= 20) return { label: 'Excellent', color: 'text-green-700 bg-green-50 border-green-200' };
    if (irr >= 15) return { label: 'Very Good', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (irr >= 10) return { label: 'Good', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    if (irr >= 5) return { label: 'Fair', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
    return { label: 'Poor', color: 'text-red-700 bg-red-50 border-red-200' };
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCalculate} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="holdingPeriod" className="block text-sm font-medium text-gray-700 mb-1">
              Holding Period (years)
            </label>
            <input
              id="holdingPeriod"
              name="holdingPeriod"
              type="number"
              min="1"
              max="30"
              value={inputs.holdingPeriod}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${errors.holdingPeriod ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.holdingPeriod && <p className="mt-1 text-sm text-red-600">{errors.holdingPeriod}</p>}
          </div>
          <div>
            <label htmlFor="annualAppreciation" className="block text-sm font-medium text-gray-700 mb-1">
              Annual Appreciation (%)
            </label>
            <input
              id="annualAppreciation"
              name="annualAppreciation"
              type="number"
              step="0.5"
              value={inputs.annualAppreciation}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${errors.annualAppreciation ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.annualAppreciation && <p className="mt-1 text-sm text-red-600">{errors.annualAppreciation}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="sellingCosts" className="block text-sm font-medium text-gray-700 mb-1">
              Selling Costs (%)
            </label>
            <input
              id="sellingCosts"
              name="sellingCosts"
              type="number"
              step="0.5"
              value={inputs.sellingCosts}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${errors.sellingCosts ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.sellingCosts && <p className="mt-1 text-sm text-red-600">{errors.sellingCosts}</p>}
          </div>
          <div>
            <label htmlFor="rentGrowthRate" className="block text-sm font-medium text-gray-700 mb-1">
              Rent Growth (%)
            </label>
            <input
              id="rentGrowthRate"
              name="rentGrowthRate"
              type="number"
              step="0.5"
              value={inputs.rentGrowthRate}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${errors.rentGrowthRate ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.rentGrowthRate && <p className="mt-1 text-sm text-red-600">{errors.rentGrowthRate}</p>}
          </div>
          <div>
            <label htmlFor="expenseGrowthRate" className="block text-sm font-medium text-gray-700 mb-1">
              Expense Growth (%)
            </label>
            <input
              id="expenseGrowthRate"
              name="expenseGrowthRate"
              type="number"
              step="0.5"
              value={inputs.expenseGrowthRate}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${errors.expenseGrowthRate ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.expenseGrowthRate && <p className="mt-1 text-sm text-red-600">{errors.expenseGrowthRate}</p>}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Calculate IRR
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          <div className={`rounded-xl border-2 p-6 text-center ${getIrrRating(result.irr).color}`}>
            <p className="text-sm font-medium uppercase tracking-wide">Internal Rate of Return</p>
            <p className="text-5xl font-bold mt-2">{result.irr.toFixed(2)}%</p>
            <p className="text-lg font-semibold mt-1">{getIrrRating(result.irr).label}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Equity Multiple</p>
              <p className="text-2xl font-bold text-gray-900">{result.equityMultiple.toFixed(2)}x</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Exit Value</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(result.exitValue)}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Annual Cash Flows</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between font-medium text-gray-700">
                <span>Year 0 (Investment)</span>
                <span className="text-red-600">-{fmt(result.initialInvestment)}</span>
              </div>
              {result.annualCashFlows.map((cf, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-600">
                    Year {i + 1} {i === result.annualCashFlows.length - 1 ? '(incl. sale)' : ''}
                  </span>
                  <span className={cf >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(cf)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
