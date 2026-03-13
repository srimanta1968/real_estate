import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import IrrCalculator from '../components/irr/IrrCalculator';

interface StoredFinancials {
  purchasePrice: number;
  downPayment: number;
  annualNOI: number;
  annualDebtService: number;
}

export default function IrrPage() {
  const navigate = useNavigate();
  const [financials, setFinancials] = useState<StoredFinancials | null>(null);
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

      const property = JSON.parse(propertyStored);
      const financing = JSON.parse(financingStored);
      const expense = JSON.parse(expenseStored);

      const purchasePrice = parseFloat(property.purchase_price);
      const downPayment = parseFloat(financing.down_payment) || 0;
      const loanAmount = parseFloat(financing.loan_amount);
      const interestRate = parseFloat(financing.interest_rate) / 100 / 12;
      const totalPayments = parseInt(financing.loan_term) * 12;

      let annualDebtService = 0;
      if (!isNaN(loanAmount) && !isNaN(interestRate) && interestRate > 0 && !isNaN(totalPayments)) {
        const monthlyPayment = loanAmount * (interestRate * Math.pow(1 + interestRate, totalPayments)) / (Math.pow(1 + interestRate, totalPayments) - 1);
        annualDebtService = monthlyPayment * 12;
      }

      const monthlyRental = parseFloat(expense.monthly_rental_income);
      const vacancyRate = parseFloat(expense.vacancy_rate) || 0;
      const propertyTax = parseFloat(expense.property_tax) || 0;
      const insurance = parseFloat(expense.insurance) || 0;
      const maintenance = parseFloat(expense.maintenance) || 0;
      const managementFee = parseFloat(expense.management_fee) || 0;

      const annualRental = monthlyRental * 12;
      const effectiveIncome = annualRental * (1 - vacancyRate / 100);
      const mgmtExpense = effectiveIncome * (managementFee / 100);
      const annualNOI = effectiveIncome - propertyTax - insurance - maintenance - mgmtExpense;

      setFinancials({ purchasePrice, downPayment, annualNOI, annualDebtService });
    } catch (err) {
      setError('Failed to load financial data.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-indigo-600">DealEval</Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-indigo-600">IRR Analysis</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">IRR Analysis</h1>
          <p className="mt-2 text-gray-500">
            Internal Rate of Return projects your annualized return over the holding period.
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
        ) : financials ? (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <IrrCalculator
              purchasePrice={financials.purchasePrice}
              downPayment={financials.downPayment}
              annualNOI={financials.annualNOI}
              annualDebtService={financials.annualDebtService}
            />

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
                onClick={() => navigate('/property/cashflow')}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                View Cash Flow
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500">Loading financial data...</p>
          </div>
        )}
      </main>
    </div>
  );
}
