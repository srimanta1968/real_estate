import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ScenarioComparison from '../components/scenario/ScenarioComparison';
import { Scenario, ScenarioInput } from '../types/scenario';
import { exportScenarioPdf } from '../utils/exportPdf';
import AuthModal from '../components/auth/AuthModal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<ScenarioPageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const scenariosRef = useRef<ScenarioInput[]>([]);
  const resultsRef = useRef<Scenario[]>([]);

  const [remaining, setRemaining] = useState<number | null>(null);
  const [tierError, setTierError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/pdf/download-count').then(res => {
        setRemaining(res.data.data.remaining);
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleExportPdf = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Check free tier
    try {
      const countRes = await api.get('/pdf/download-count');
      const rem = countRes.data.data.remaining;
      if (rem <= 0) {
        setTierError('You have used all 5 free PDF downloads. Please upgrade to continue.');
        return;
      }

      // Track download
      const address = sessionStorage.getItem('propertyInfo') ? JSON.parse(sessionStorage.getItem('propertyInfo')!).address : '';
      await api.post('/pdf/track-download', { property_address: address });
      setRemaining(rem - 1);

      // Auto-save property config
      const propertyData = JSON.parse(sessionStorage.getItem('propertyInfo') || '{}');
      const financingData = JSON.parse(sessionStorage.getItem('financingInfo') || '{}');
      const expenseData = JSON.parse(sessionStorage.getItem('expenseInfo') || '{}');
      api.post('/saved-properties/save', { property_data: propertyData, financing_data: financingData, expense_data: expenseData }).catch(() => {});

      exportScenarioPdf(scenariosRef.current, resultsRef.current);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setTierError(err.response.data.error);
      } else {
        exportScenarioPdf(scenariosRef.current, resultsRef.current);
      }
    }
  };

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
            <ScenarioComparison
              {...data}
              onDataChange={(scenarios, results) => {
                scenariosRef.current = scenarios;
                resultsRef.current = results;
              }}
            />

            {tierError && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6 text-center">
                <p className="text-amber-800 font-medium">{tierError}</p>
                <p className="text-amber-600 text-sm mt-1">Contact us to upgrade your plan.</p>
              </div>
            )}

            {isAuthenticated && remaining !== null && !tierError && (
              <p className="text-sm text-gray-400 text-center mt-6">
                {remaining}/5 free PDF downloads remaining
              </p>
            )}

            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={() => navigate('/property/dashboard')}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
                Export PDF
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // After auth, trigger export with tracking
          handleExportPdf();
        }}
      />
    </div>
  );
}
