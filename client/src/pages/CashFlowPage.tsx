import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CashFlowDisplay from '../components/cashflow/CashFlowDisplay';
import { CashFlowBreakdown } from '../types/cashflow';

export default function CashFlowPage() {
  const navigate = useNavigate();
  const [monthly, setMonthly] = useState<CashFlowBreakdown | null>(null);
  const [annual, setAnnual] = useState<CashFlowBreakdown | null>(null);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const propertyStored = sessionStorage.getItem('propertyInfo');
      const financingStored = sessionStorage.getItem('financingInfo');
      const expenseStored = sessionStorage.getItem('expenseInfo');

      if (!propertyStored || !financingStored || !expenseStored) {
        setError('Missing data. Please complete all previous steps.');
        return;
      }

      const financing = JSON.parse(financingStored);
      const expense = JSON.parse(expenseStored);

      const dp = parseFloat(financing.down_payment) || 0;
      setDownPayment(dp);

      const loanAmount = parseFloat(financing.loan_amount);
      const interestRate = parseFloat(financing.interest_rate) / 100 / 12;
      const totalPayments = parseInt(financing.loan_term) * 12;

      let monthlyMortgage = 0;
      if (!isNaN(loanAmount) && !isNaN(interestRate) && interestRate > 0 && !isNaN(totalPayments)) {
        monthlyMortgage = loanAmount * (interestRate * Math.pow(1 + interestRate, totalPayments)) / (Math.pow(1 + interestRate, totalPayments) - 1);
      }

      const monthlyRental = parseFloat(expense.monthly_rental_income);
      const vacancyRate = parseFloat(expense.vacancy_rate) || 0;
      const annualPropertyTax = parseFloat(expense.property_tax) || 0;
      const annualInsurance = parseFloat(expense.insurance) || 0;
      const annualMaintenance = parseFloat(expense.maintenance) || 0;
      const managementPct = parseFloat(expense.management_fee) || 0;

      const grossMonthly = monthlyRental;
      const vacancyMonthly = grossMonthly * (vacancyRate / 100);
      const egiMonthly = grossMonthly - vacancyMonthly;
      const mgmtMonthly = egiMonthly * (managementPct / 100);
      const taxMonthly = annualPropertyTax / 12;
      const insMonthly = annualInsurance / 12;
      const maintMonthly = annualMaintenance / 12;
      const totalExpMonthly = taxMonthly + insMonthly + maintMonthly + mgmtMonthly;
      const noiMonthly = egiMonthly - totalExpMonthly;
      const netCfMonthly = noiMonthly - monthlyMortgage;

      const annualNetCf = netCfMonthly * 12;
      const cocReturn = dp > 0 ? (annualNetCf / dp) * 100 : 0;

      const buildBreakdown = (multiplier: number): CashFlowBreakdown => ({
        grossRentalIncome: grossMonthly * multiplier,
        vacancyLoss: vacancyMonthly * multiplier,
        effectiveGrossIncome: egiMonthly * multiplier,
        propertyTax: taxMonthly * multiplier,
        insurance: insMonthly * multiplier,
        maintenance: maintMonthly * multiplier,
        managementFee: mgmtMonthly * multiplier,
        totalExpenses: totalExpMonthly * multiplier,
        netOperatingIncome: noiMonthly * multiplier,
        mortgagePayment: monthlyMortgage * multiplier,
        netCashFlow: netCfMonthly * multiplier,
        cashOnCashReturn: cocReturn,
      });

      setMonthly(buildBreakdown(1));
      setAnnual(buildBreakdown(12));
    } catch (err) {
      setError('Failed to calculate cash flow.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-indigo-600">DealEval</Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-indigo-600">Cash Flow Analysis</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cash Flow Analysis</h1>
          <p className="mt-2 text-gray-500">
            Detailed breakdown of income, expenses, and net cash flow.
          </p>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={() => navigate('/property/new')}
              className="mt-4 text-indigo-600 font-medium hover:text-indigo-700"
            >
              Start Over
            </button>
          </div>
        ) : monthly && annual ? (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <CashFlowDisplay monthly={monthly} annual={annual} downPayment={downPayment} />

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => navigate('/property/analysis')}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Cap Rate
              </button>
              <button
                type="button"
                onClick={() => navigate('/property/projections')}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                10-Year Projections
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500">Calculating cash flow...</p>
          </div>
        )}
      </main>
    </div>
  );
}
