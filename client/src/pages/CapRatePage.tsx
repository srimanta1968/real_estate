import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CapRateDisplay from '../components/caprate/CapRateDisplay';
import { CapRateCalculation } from '../types/caprate';

export default function CapRatePage() {
  const navigate = useNavigate();
  const [calculation, setCalculation] = useState<CapRateCalculation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const propertyStored = sessionStorage.getItem('propertyInfo');
      const expenseStored = sessionStorage.getItem('expenseInfo');

      if (!propertyStored || !expenseStored) {
        setError('Missing property or expense data. Please complete all previous steps.');
        return;
      }

      const property = JSON.parse(propertyStored);
      const expense = JSON.parse(expenseStored);

      const purchasePrice = parseFloat(property.purchase_price);
      const monthlyRental = parseFloat(expense.monthly_rental_income);
      const propertyTax = parseFloat(expense.property_tax) || 0;
      const insurance = parseFloat(expense.insurance) || 0;
      const maintenance = parseFloat(expense.maintenance) || 0;
      const managementFee = parseFloat(expense.management_fee) || 0;
      const vacancyRate = parseFloat(expense.vacancy_rate) || 0;

      if (isNaN(purchasePrice) || purchasePrice <= 0) {
        setError('Invalid purchase price. Please go back and correct.');
        return;
      }

      if (isNaN(monthlyRental) || monthlyRental <= 0) {
        setError('Invalid rental income. Please go back and correct.');
        return;
      }

      const annualRentalIncome = monthlyRental * 12;
      const effectiveGrossIncome = annualRentalIncome * (1 - vacancyRate / 100);
      const mgmtExpense = effectiveGrossIncome * (managementFee / 100);
      const annualExpenses = propertyTax + insurance + maintenance + mgmtExpense;
      const netOperatingIncome = effectiveGrossIncome - annualExpenses;
      const capRate = (netOperatingIncome / purchasePrice) * 100;

      setCalculation({
        purchasePrice,
        annualRentalIncome,
        annualExpenses,
        vacancyRate,
        effectiveGrossIncome,
        netOperatingIncome,
        capRate,
      });
    } catch (err) {
      setError('Failed to calculate cap rate. Please check your inputs.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-indigo-600">DealEval</Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-indigo-600">Analysis Results</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cap Rate Analysis</h1>
          <p className="mt-2 text-gray-500">
            Capitalization rate measures the expected rate of return on your investment property.
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
        ) : calculation ? (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <CapRateDisplay calculation={calculation} />

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => navigate('/property/expenses')}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Expenses
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
            <p className="text-gray-500">Calculating...</p>
          </div>
        )}
      </main>
    </div>
  );
}
