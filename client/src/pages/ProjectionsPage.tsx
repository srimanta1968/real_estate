import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProjectionTable from '../components/projection/ProjectionTable';

interface ProjectionFinancials {
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

export default function ProjectionsPage() {
  const navigate = useNavigate();
  const [financials, setFinancials] = useState<ProjectionFinancials | null>(null);
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

      setFinancials({
        purchasePrice: parseFloat(property.purchase_price),
        downPayment: parseFloat(financing.down_payment) || 0,
        loanAmount: parseFloat(financing.loan_amount),
        interestRate: parseFloat(financing.interest_rate),
        loanTerm: parseInt(financing.loan_term),
        monthlyRental: parseFloat(expense.monthly_rental_income),
        vacancyRate: parseFloat(expense.vacancy_rate) || 0,
        annualPropertyTax: parseFloat(expense.property_tax) || 0,
        annualInsurance: parseFloat(expense.insurance) || 0,
        annualMaintenance: parseFloat(expense.maintenance) || 0,
        managementFeePct: parseFloat(expense.management_fee) || 0,
      });
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
              <span className="font-medium text-indigo-600">10-Year Projections</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">10-Year Financial Projections</h1>
          <p className="mt-2 text-gray-500">
            Project your investment returns over time with adjustable growth assumptions.
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
            <ProjectionTable {...financials} />

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => navigate('/property/cashflow')}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Cash Flow
              </button>
              <button
                type="button"
                onClick={() => navigate('/property/dashboard')}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                View Dashboard
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
