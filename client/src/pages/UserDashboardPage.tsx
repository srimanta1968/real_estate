import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface SavedProperty {
  id: string;
  property_name: string;
  property_data: Record<string, any>;
  financing_data: Record<string, any>;
  expense_data: Record<string, any>;
  created_at: string;
}

interface DownloadInfo {
  count: number;
  remaining: number;
  limit: number;
}

const fmt = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [downloadInfo, setDownloadInfo] = useState<DownloadInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    const loadData = async () => {
      try {
        const [propsRes, dlRes] = await Promise.all([
          api.get('/saved-properties/my-properties'),
          api.get('/subscriptions/usage').catch(() => api.get('/pdf/download-count')),
        ]);
        setProperties(propsRes.data.data.properties);
        setDownloadInfo(dlRes.data.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAuthenticated, navigate]);

  const handleViewAnalysis = (prop: SavedProperty) => {
    sessionStorage.setItem('propertyInfo', JSON.stringify(prop.property_data));
    sessionStorage.setItem('financingInfo', JSON.stringify(prop.financing_data));
    sessionStorage.setItem('expenseInfo', JSON.stringify(prop.expense_data));
    navigate('/property/analysis');
  };

  const handleDownloadPdf = async (prop: SavedProperty) => {
    if (!downloadInfo || downloadInfo.remaining <= 0) {
      setError('You have used all your credits this month. Visit /pricing to upgrade your plan.');
      return;
    }

    // Load config into session then navigate to scenario page for PDF
    sessionStorage.setItem('propertyInfo', JSON.stringify(prop.property_data));
    sessionStorage.setItem('financingInfo', JSON.stringify(prop.financing_data));
    sessionStorage.setItem('expenseInfo', JSON.stringify(prop.expense_data));
    navigate('/property/scenarios');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-indigo-600">DealEval</Link>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium text-indigo-600">My Dashboard</span>
              <Link to="/property/new" className="text-gray-500 hover:text-indigo-600">New Analysis</Link>
              <button onClick={logout} className="text-gray-400 hover:text-red-500">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="mt-1 text-gray-500">
              Welcome back{user?.email ? `, ${user.email}` : ''}
            </p>
          </div>
          {downloadInfo && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 text-center">
              <p className="text-sm font-medium text-indigo-700">
                {downloadInfo.remaining}/{downloadInfo.limit} credits remaining this month
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {properties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-gray-300 text-6xl mb-4">&#127968;</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved properties yet</h2>
            <p className="text-gray-500 mb-6">
              Start analyzing a property and export a PDF to save it here.
            </p>
            <button
              onClick={() => navigate('/property/new')}
              className="bg-indigo-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Analyze Your First Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => {
              const purchasePrice = parseFloat(prop.property_data?.purchase_price) || 0;
              const monthlyRent = parseFloat(prop.expense_data?.monthly_rental_income) || 0;
              const address = prop.property_data?.address || prop.property_name || 'Untitled';

              return (
                <div key={prop.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-indigo-600 px-5 py-3">
                    <h3 className="text-white font-semibold truncate" title={address}>{address}</h3>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <p className="text-xs text-gray-400 uppercase">Purchase Price</p>
                        <p className="text-sm font-semibold text-gray-900">{fmt(purchasePrice)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase">Monthly Rent</p>
                        <p className="text-sm font-semibold text-gray-900">{fmt(monthlyRent)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">
                      Saved {new Date(prop.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewAnalysis(prop)}
                        className="flex-1 border border-indigo-600 text-indigo-600 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
                      >
                        View Analysis
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(prop)}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/property/new')}
            className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700"
          >
            + Analyze New Property
          </button>
        </div>
      </main>
    </div>
  );
}
