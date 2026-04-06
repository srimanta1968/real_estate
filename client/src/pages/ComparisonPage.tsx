import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { exportComparisonPdf } from '../utils/exportComparisonPdf';

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
  const [pdfError, setPdfError] = useState('');

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

  const handleExportPdf = async () => {
    if (!activeSet || computed.length < 2) return;
    setPdfError('');

    const propertyCount = activeSet.items.length;

    try {
      // Check credits first
      const usageRes = await api.get('/subscriptions/usage');
      const usage = usageRes.data.data;
      if (usage.remaining < propertyCount) {
        setPdfError(`Need ${propertyCount} credits (1 per property) but only ${usage.remaining} remaining. Upgrade at /pricing.`);
        return;
      }

      // Generate PDF first — credit only deducted after successful download
      exportComparisonPdf(activeSet.name, activeSet.items.map(i => ({
        property_name: i.property_name,
        property_data: i.property_data,
        financing_data: i.financing_data,
        expense_data: i.expense_data,
      })));

      // PDF generated successfully — now consume credits
      const addresses = activeSet.items.map(i => i.property_data?.address || i.property_name || 'Unknown');
      api.post('/subscriptions/consume-credits', {
        creditsNeeded: propertyCount,
        reportType: 'comparison',
        propertyAddresses: addresses,
        comparisonSetId: activeSet.id,
      }).catch(() => {});
    } catch (err: any) {
      if (err.response?.status === 403) {
        setPdfError(err.response.data.error);
      }
    }
  };

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
            <button
              onClick={handleExportPdf}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
              disabled={!activeSet || computed.length < 2}
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* Credit cost info for PDF */}
        {activeSet && computed.length >= 2 && (
          <p className="text-xs text-gray-400 text-right mb-2 -mt-6">
            PDF export uses {computed.length} credit{computed.length > 1 ? 's' : ''} (1 per property)
          </p>
        )}

        {pdfError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {pdfError} <a href="/pricing" className="font-semibold underline ml-1">Upgrade plan</a>
          </div>
        )}

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

        {/* Property Summary Cards */}
        {activeSet && computed.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {computed.map((c, idx) => {
              const item = activeSet.items[idx];
              const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];
              const color = colors[idx % colors.length];
              return (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className={`${color} px-4 py-2`}>
                    <h3 className="text-white font-semibold text-sm truncate">{c.address}</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-xl font-bold text-gray-900">{fmt(c.purchasePrice)}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <span>Rent: {fmt(c.monthlyRent)}/mo</span>
                      <span>Cap: {c.capRate.toFixed(1)}%</span>
                      <span>CoC: {c.cashOnCash.toFixed(1)}%</span>
                      <span>CF: {fmt(c.monthlyCF)}/mo</span>
                    </div>
                    {item.property_data?.city && (
                      <p className="mt-2 text-xs text-gray-400">{item.property_data.city}, {item.property_data.state}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cross-market banner */}
        {activeSet && computed.length > 1 && (() => {
          const cities = new Set(activeSet.items.map(i => i.property_data?.city).filter(Boolean));
          return cities.size > 1 ? (
            <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-800">
              <span>{'\ud83d\udccd'}</span>
              <span>Cross-market comparison: Properties from {Array.from(cities).join(', ')}. Consider local market conditions when comparing.</span>
            </div>
          ) : null;
        })()}

        {/* Comparison Table */}
        {activeSet && computed.length > 0 ? (
          <>
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

          {/* Visual Comparison Bar Charts */}
          <div className="mt-8 space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Visual Comparison</h3>
              {METRICS.map(metric => {
                const values = computed.map(c => c[metric.key] as number);
                const maxVal = Math.max(...values.map(Math.abs));
                const best = metric.higherIsBetter ? Math.max(...values) : Math.min(...values);
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];
                if (maxVal === 0) return null;
                return (
                  <div key={metric.key} className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">{metric.label}</p>
                    <div className="space-y-2">
                      {computed.map((c, idx) => {
                        const val = c[metric.key] as number;
                        const pct = maxVal > 0 ? (Math.abs(val) / maxVal) * 100 : 0;
                        const isBest = val === best;
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-24 truncate" title={c.address}>{c.address.split(',')[0]}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                              <div className={`h-full rounded-full ${colors[idx % colors.length]} ${isBest ? 'ring-2 ring-offset-1 ring-yellow-400' : ''}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                            </div>
                            <span className={`text-xs font-semibold w-20 text-right ${isBest ? 'text-green-600' : 'text-gray-700'}`}>
                              {metric.format(val)}{isBest ? ' \u2605' : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recommendation Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recommendation Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {METRICS.map(metric => {
                  const values = computed.map(c => c[metric.key] as number);
                  const bestVal = metric.higherIsBetter ? Math.max(...values) : Math.min(...values);
                  const bestIdx = values.indexOf(bestVal);
                  if (bestIdx < 0) return null;
                  return (
                    <div key={metric.key} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                      <span className="text-green-500 text-lg">{'\u2605'}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Best {metric.label}</p>
                        <p className="text-xs text-gray-500">{computed[bestIdx].address.split(',')[0]} — {metric.format(bestVal)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          </>
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
