import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ExpenseForm from '../components/expense/ExpenseForm';
import { ExpenseFormData } from '../types/expense';

export default function ExpensePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState<number | undefined>();
  const [monthlyMortgage, setMonthlyMortgage] = useState<number | undefined>();

  useEffect(() => {
    const propertyStored = sessionStorage.getItem('propertyInfo');
    if (propertyStored) {
      const data = JSON.parse(propertyStored);
      const price = parseFloat(data.purchase_price);
      if (!isNaN(price)) setPurchasePrice(price);
    }

    const financingStored = sessionStorage.getItem('financingInfo');
    if (financingStored) {
      const data = JSON.parse(financingStored);
      const principal = parseFloat(data.loan_amount);
      const rate = parseFloat(data.interest_rate) / 100 / 12;
      const payments = parseInt(data.loan_term) * 12;
      if (!isNaN(principal) && !isNaN(rate) && !isNaN(payments) && rate > 0) {
        const monthly = principal * (rate * Math.pow(1 + rate, payments)) / (Math.pow(1 + rate, payments) - 1);
        setMonthlyMortgage(monthly);
      }
    }
  }, []);

  function handleSubmit(data: ExpenseFormData) {
    setLoading(true);
    sessionStorage.setItem('expenseInfo', JSON.stringify(data));
    setLoading(false);
    navigate('/property/analysis');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-indigo-600">DealEval</Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
              <span className="text-green-600">Property</span>
              <span className="mx-1">-</span>
              <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
              <span className="text-green-600">Financing</span>
              <span className="mx-1">-</span>
              <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
              <span className="font-medium text-indigo-600">Expenses</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Operating Expenses</h1>
          <p className="mt-2 text-gray-500">
            Enter your expected expenses and rental income to evaluate the deal.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <ExpenseForm
            onSubmit={handleSubmit}
            purchasePrice={purchasePrice}
            monthlyMortgage={monthlyMortgage}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}
