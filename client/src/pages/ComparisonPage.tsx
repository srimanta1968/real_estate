import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface ComparisonSet {
  id: string;
  name: string;
  items: ComparisonItem[];
  created_at: string;
}

interface ComparisonItem {
  id: string;
  saved_property_id: string;
  property_name: string;
  property_data: Record<string, any>;
  financing_data: Record<string, any>;
  expense_data: Record<string, any>;
  display_order: number;
}

interface ComputedMetrics {
  address: string;
  purchasePrice: number;
  monthlyRent: number;
  capRate: number;
  cashOnCash: number;
  dscr: number;
  grm: number;
  monthlyCF: number;
  opExRatio: number;
}

const fmt = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

function computeMetrics(item: ComparisonItem): ComputedMetrics {
  const p = item.property_data || {};
  const f = item.financing_data || {};
  const e = item.expense_data || {};

  const purchasePrice = parseFloat(p.purchase_price) || 0;
  const downPayment = parseFloat(f.down_payment) || 0;
  const loanAmount = parseFloat(f.loan_amount) || 0;
  const interestRate = (parseFloat(f.interest_rate) || 0) / 100 / 12;
  const totalPayments = (parseInt(f.loan_term) || 30) * 12;

  let monthlyMortgage = 0;
  if (loanAmount > 0 && interestRate > 0) {
    monthlyMortgage = loanAmount * (interestRate * Math.pow(1 + interestRate, totalPayments)) / (Math.pow(1 + interestRate, totalPayments) - 1);
  }

  const monthlyRent = parseFloat(e.monthly_rental_income) || 0;
  const vacancyRate = parseFloat(e.vacancy_rate) || 0;
  const annualRental = monthlyRent * 12;
  const egi = annualRental * (1 - vacancyRate / 100);
  const totalExpenses = (parseFloat(e.property_tax) || 0) + (parseFloat(e.insurance) || 0) + (parseFloat(e.maintenance) || 0) + egi * ((parseFloat(e.management_fee) || 0) / 100);
  const noi = egi - totalExpenses;
  const annualDebt = monthlyMortgage * 12;
  const netCF = noi - annualDebt;

  return {
    address: p.address || item.property_name || 'Untitled',
    purchasePrice,
    monthlyRent,
    capRate: purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0,
    cashOnCash: downPayment > 0 ? (netCF / downPayment) * 100 : 0,
    dscr: annualDebt > 0 ? noi / annualDebt : 0,
    grm: annualRental > 0 ? purchasePrice / annualRental : 0,
    monthlyCF: netCF / 12,
    opExRatio: egi > 0 ? (totalExpenses / egi) * 100 : 0,
  };
}

const METRICS: { key: keyof ComputedMetrics; label: string; format: (v: number) => string; higherIsBetter: boolean }[] = [
  { key: 'purchasePrice', label: 'Purchase Price', format: fmt, higherIsBetter: false },
  { key: 'monthlyRent', label: 'Monthly Rent', format: fmt, higherIsBetter: true },
  { key: 'capRate', label: 'Cap Rate', format: v => `${v.toFixed(2)}%`, higherIsBetter: true },
  { key: 'cashOnCash', label: 'Cash-on-Cash', format: v => `${v.toFixed(2)}%`, higherIsBetter: true },
  { key: 'dscr', label: 'DSCR', format: v => v.toFixed(2), higherIsBetter: true },
  { key: 'grm', label: 'GRM', format: v => v.toFixed(1), higherIsBetter: false },
  { key: 'monthlyCF', label: 'Monthly Cash Flow', format: fmt, higherIsBetter: true },
  { key: 'opExRatio', label: 'OpEx Ratio', format: v => `${v.toFixed(1)}%`, higherIsBetter: false },
];

export default function ComparisonPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [sets, setSets] = useState<{ id: string; name: string; created_at: string }[]>([]);
  const [activeSet, setActiveSet] = useState<ComparisonSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSetName, setNewSetName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { replace: true }); return; }
    loadSets();
  }, [isAuthenticated]);

  const loadSets = async () => {
    try {
      const res = await api.get('/comparisons');
      setSets(res.data.data.comparisonSets);
      if (res.data.data.comparisonSets.length > 0) {
        await loadSet(res.data.data.comparisonSets[0].id);
      }
    } catch {} finally { setLoading(false); }
  };

  const loadSet = async (setId: string) => {
    try {
      const res = await api.get(`/comparisons/${setId}`);
      setActiveSet(res.data.data.comparisonSet);
    } catch {}
  };

  const handleCreate = async () => {
    if (!newSetName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/comparisons', { name: newSetName.trim() });
      setSets(prev => [res.data.data.comparisonSet, ...prev]);
      setActiveSet({ ...res.data.data.comparisonSet, items: [] });
      setNewSetName('');
    } catch {} finally { setCreating(false); }
  };

  const handleRemoveProperty = async (savedPropertyId: string) => {
    if (!activeSet) return;
    try {
      await api.delete(`/comparisons/${activeSet.id}/remove/${savedPropertyId}`);
      setActiveSet(prev => prev ? { ...prev, items: prev.items.filter(i => i.saved_property_id !== savedPropertyId) } : null);
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const computed = activeSet?.items.map(computeMetrics) || [];

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Compare Properties</h1>
            <p className="mt-1 text-gray-500">Side-by-side financial metric comparison</p>
          </div>
          <div className="flex items-center gap-3">
            {sets.length > 0 && (
              <select
                value={activeSet?.id || ''}
                onChange={e => loadSet(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {sets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Create New Set */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={newSetName}
              onChange={e => setNewSetName(e.target.value)}
              placeholder="New comparison set name..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newSetName.trim()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Set'}
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        {activeSet && computed.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-40">Metric</th>
                    {computed.map((c, idx) => (
                      <th key={idx} className="text-center px-6 py-4 min-w-[180px]">
                        <p className="text-sm font-semibold text-gray-900 truncate" title={c.address}>{c.address}</p>
                        <button
                          onClick={() => handleRemoveProperty(activeSet.items[idx].saved_property_id)}
                          className="text-xs text-red-400 hover:text-red-600 mt-1"
                        >
                          Remove
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map(metric => {
                    const values = computed.map(c => c[metric.key] as number);
                    const best = metric.higherIsBetter ? Math.max(...values) : Math.min(...values);

                    return (
                      <tr key={metric.key} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-700">{metric.label}</td>
                        {values.map((val, idx) => (
                          <td key={idx} className={`px-6 py-3 text-center text-sm font-semibold ${val === best ? 'text-green-600 bg-green-50' : 'text-gray-900'}`}>
                            {metric.format(val)}
                            {val === best && <span className="ml-1 text-xs">&#9733;</span>}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeSet ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-gray-300 text-5xl mb-4">&#128200;</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties in this set</h3>
            <p className="text-gray-500 mb-6">
              Go to your <Link to="/dashboard" className="text-indigo-600 hover:underline">Dashboard</Link> and click "Add to Comparison" on saved properties.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-gray-300 text-5xl mb-4">&#128200;</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create your first comparison set</h3>
            <p className="text-gray-500">Enter a name above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
