import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ScenarioComparison from '../components/scenario/ScenarioComparison';
import { ScenarioInput } from '../types/scenario';

interface ScenarioPageData {
  baseScenario: ScenarioInput;
  annualPropertyTax: number;
  annualInsurance: number;
  annualMaintenance: number;
  managementFeePct: number;
  loanTerm: number;
}

export default function ScenarioPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ScenarioPageData | null>(null);
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
      const downPaymentPct = purchasePrice > 0 ? (downPayment / purchasePrice) * 100 : 20;

      setData({
        baseScenario: {
          name: 'Base Case',
          purchasePrice: property.purchase_price,
          downPaymentPct: downPaymentPct.toFixed(1),
          interestRate: financing.interest_rate,
          monthlyRent: expense.monthly_rental_income,
          vacancyRate: expense.vacancy_rate || '5',
        },
        annualPropertyTax: parseFloat(expense.property_tax) || 0,
        annualInsurance: parseFloat(expense.insurance) || 0,
        annualMaintenance: parseFloat(expense.maintenance) || 0,
        managementFeePct: parseFloat(expense.management_fee) || 0,
        loanTerm: parseInt(financing.loan_term) || 30,
      });
    } catch (err) {
      setError('Failed to load scenario data.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-indigo-600">DealEval</Link>
            <div className="flex items-center gap-4 text-sm">
              <Link to="/property/dashboard" className="text-gray-500 hover:text-indigo-600">Dashboard</Link>
              <span className="font-medium text-indigo-600">Scenarios</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Scenario Comparison</h1>
          <p className="mt-2 text-gray-500">
            Compare different investment scenarios side by side to find the best deal.
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
        ) : data ? (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <ScenarioComparison {...data} />

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => navigate('/property/dashboard')}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate('/property/new')}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Analyze New Property
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500">Loading scenario data...</p>
          </div>
        )}
      </main>
    </div>
  );
}
