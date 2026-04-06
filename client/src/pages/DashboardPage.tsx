import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MetricsDashboard from '../components/visualization/MetricsDashboard';
import AddToComparisonModal from '../components/common/AddToComparisonModal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MetricCard, BarChartData } from '../types/visualization';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState<BarChartData[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<BarChartData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [savedPropertyId, setSavedPropertyId] = useState('');

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

      let monthlyMortgage = 0;
      if (!isNaN(loanAmount) && !isNaN(interestRate) && interestRate > 0) {
        monthlyMortgage = loanAmount * (interestRate * Math.pow(1 + interestRate, totalPayments)) / (Math.pow(1 + interestRate, totalPayments) - 1);
      }

      const monthlyRental = parseFloat(expense.monthly_rental_income);
      const vacancyRate = parseFloat(expense.vacancy_rate) || 0;
      const annualPropertyTax = parseFloat(expense.property_tax) || 0;
      const annualInsurance = parseFloat(expense.insurance) || 0;
      const annualMaintenance = parseFloat(expense.maintenance) || 0;
      const managementPct = parseFloat(expense.management_fee) || 0;

      const annualRental = monthlyRental * 12;
      const vacancyLoss = annualRental * (vacancyRate / 100);
      const egi = annualRental - vacancyLoss;
      const mgmtExpense = egi * (managementPct / 100);
      const totalExpenses = annualPropertyTax + annualInsurance + annualMaintenance + mgmtExpense;
      const noi = egi - totalExpenses;
      const annualDebtService = monthlyMortgage * 12;
      const netCashFlow = noi - annualDebtService;
      const capRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
      const cocReturn = downPayment > 0 ? (netCashFlow / downPayment) * 100 : 0;
      const debtCoverageRatio = annualDebtService > 0 ? noi / annualDebtService : 0;
      const grossRentMultiplier = annualRental > 0 ? purchasePrice / annualRental : 0;
      const operatingExpenseRatio = egi > 0 ? (totalExpenses / egi) * 100 : 0;

      const fmt = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

      function rateMetric(value: number, excellent: number, good: number, average: number): MetricCard['rating'] {
        if (value >= excellent) return 'excellent';
        if (value >= good) return 'good';
        if (value >= average) return 'average';
        return 'poor';
      }

      setMetrics([
        { name: 'Cap Rate', value: `${capRate.toFixed(2)}%`, subtitle: `NOI: ${fmt(noi)}`, rating: rateMetric(capRate, 10, 7, 5) },
        { name: 'Cash-on-Cash', value: `${cocReturn.toFixed(2)}%`, subtitle: `CF: ${fmt(netCashFlow)}`, rating: rateMetric(cocReturn, 12, 8, 5) },
        { name: 'DSCR', value: debtCoverageRatio.toFixed(2), subtitle: debtCoverageRatio >= 1.25 ? 'Healthy' : 'Below threshold', rating: rateMetric(debtCoverageRatio, 1.5, 1.25, 1.0) },
        { name: 'GRM', value: grossRentMultiplier.toFixed(1), subtitle: `${fmt(purchasePrice)} / ${fmt(annualRental)}`, rating: grossRentMultiplier <= 12 ? 'good' : grossRentMultiplier <= 16 ? 'average' : 'poor' },
        { name: 'OpEx Ratio', value: `${operatingExpenseRatio.toFixed(1)}%`, subtitle: `${fmt(totalExpenses)} expenses`, rating: operatingExpenseRatio <= 35 ? 'excellent' : operatingExpenseRatio <= 45 ? 'good' : operatingExpenseRatio <= 55 ? 'average' : 'poor' },
        { name: 'Monthly CF', value: fmt(netCashFlow / 12), subtitle: 'After all expenses', rating: netCashFlow >= 0 ? (netCashFlow / 12 >= 500 ? 'excellent' : 'good') : 'poor' },
      ]);

      setIncomeBreakdown([
        { label: 'Gross Rental', value: annualRental, color: '#4f46e5' },
        { label: 'After Vacancy', value: egi, color: '#6366f1' },
        { label: 'NOI', value: noi, color: '#22c55e' },
        { label: 'Net Cash Flow', value: netCashFlow, color: netCashFlow >= 0 ? '#16a34a' : '#ef4444' },
      ]);

      setExpenseBreakdown([
        { label: 'Mortgage', value: annualDebtService, color: '#ef4444' },
        { label: 'Property Tax', value: annualPropertyTax, color: '#f97316' },
        { label: 'Insurance', value: annualInsurance, color: '#eab308' },
        { label: 'Maintenance', value: annualMaintenance, color: '#8b5cf6' },
        { label: 'Management', value: mgmtExpense, color: '#ec4899' },
        { label: 'Vacancy Loss', value: vacancyLoss, color: '#6b7280' },
      ]);
    } catch (err) {
      setError('Failed to calculate metrics.');
    }
  }, []);

  const handleAddToComparison = async () => {
    const propertyInfo = JSON.parse(sessionStorage.getItem('propertyInfo') || '{}');
    const financingInfo = JSON.parse(sessionStorage.getItem('financingInfo') || '{}');
    const expenseInfo = JSON.parse(sessionStorage.getItem('expenseInfo') || '{}');
    try {
      const res = await api.post('/saved-properties/save', {
        property_name: propertyInfo.address || 'Untitled Property',
        property_data: propertyInfo,
        financing_data: financingInfo,
        expense_data: expenseInfo,
      });
      setSavedPropertyId(res.data.data.savedProperty.id);
      setShowCompareModal(true);
    } catch {
      alert('Please log in to add properties to comparison');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-indigo-600">DealEval</Link>
            <div className="flex items-center gap-4 text-sm">
              <Link to="/property/analysis" className="text-gray-500 hover:text-indigo-600">Cap Rate</Link>
              <Link to="/property/irr" className="text-gray-500 hover:text-indigo-600">IRR</Link>
              <Link to="/property/cashflow" className="text-gray-500 hover:text-indigo-600">Cash Flow</Link>
              <Link to="/property/projections" className="text-gray-500 hover:text-indigo-600">Projections</Link>
              <span className="font-medium text-indigo-600">Dashboard</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="mt-2 text-gray-500">
            Visual overview of all key investment metrics for this property.
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
        ) : metrics.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <MetricsDashboard
              metrics={metrics}
              incomeBreakdown={incomeBreakdown}
              expenseBreakdown={expenseBreakdown}
            />

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => navigate('/property/projections')}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Projections
              </button>
              <button
                type="button"
                onClick={() => navigate('/property/scenarios')}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Compare Scenarios
              </button>
              <button
                type="button"
                onClick={handleAddToComparison}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
              >
                Add to Comparison
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500">Loading metrics...</p>
          </div>
        )}
      </main>

      <AddToComparisonModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        savedPropertyId={savedPropertyId}
        propertyAddress={JSON.parse(sessionStorage.getItem('propertyInfo') || '{}').address || 'Untitled Property'}
      />
    </div>
  );
}
