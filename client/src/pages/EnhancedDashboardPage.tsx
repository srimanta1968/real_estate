import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AddToComparisonModal from '../components/common/AddToComparisonModal';

interface DashboardData {
  totalProperties: number;
  totalComparisons: number;
  totalSearches: number;
  recentProperties: any[];
  pdfDownloads: { count: number; remaining: number; limit: number };
  tier: string;
}

interface PropertyMetrics {
  id: string;
  address: string;
  city: string;
  state: string;
  purchasePrice: number;
  downPayment: number;
  monthlyRent: number;
  capRate: number;
  cashOnCash: number;
  monthlyCF: number;
  dscr: number;
  createdAt: string;
  raw: any;
}

type SortKey = 'address' | 'city' | 'purchasePrice' | 'downPayment' | 'capRate' | 'cashOnCash' | 'monthlyCF' | 'dscr' | 'createdAt';

const fmt = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

function computePropertyMetrics(prop: any): PropertyMetrics {
  const p = prop.property_data || {};
  const f = prop.financing_data || {};
  const e = prop.expense_data || {};

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
    id: prop.id,
    address: p.address || prop.property_name || 'Untitled',
    city: p.city || '',
    state: p.state || '',
    purchasePrice,
    downPayment,
    monthlyRent,
    capRate: purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0,
    cashOnCash: downPayment > 0 ? (netCF / downPayment) * 100 : 0,
    monthlyCF: netCF / 12,
    dscr: annualDebt > 0 ? noi / annualDebt : 0,
    createdAt: prop.created_at,
    raw: prop,
  };
}

function ratingColor(value: number, thresholds: [number, number]): string {
  if (value >= thresholds[0]) return 'text-emerald-600';
  if (value >= thresholds[1]) return 'text-blue-600';
  return 'text-red-500';
}

export default function EnhancedDashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Filtering
  const [cityFilter, setCityFilter] = useState('');
  const [profitFilter, setProfitFilter] = useState<'all' | 'profitable' | 'negative'>('all');

  // Multi-select for comparison
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creatingSet, setCreatingSet] = useState(false);

  // Single compare modal
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [comparePropertyId, setComparePropertyId] = useState('');
  const [comparePropertyAddress, setComparePropertyAddress] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { replace: true }); return; }
    const load = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        setData(res.data.data);
      } catch {
        setData({ totalProperties: 0, totalComparisons: 0, totalSearches: 0, recentProperties: [], pdfDownloads: { count: 0, remaining: 5, limit: 5 }, tier: 'free' });
      } finally { setLoading(false); }
    };
    load();
  }, [isAuthenticated]);

  // Compute metrics for all properties
  const allMetrics = useMemo(() => {
    if (!data) return [];
    return data.recentProperties.map(computePropertyMetrics);
  }, [data]);

  // Unique cities for filter dropdown
  const cities = useMemo(() => {
    const set = new Set(allMetrics.map(m => m.city).filter(Boolean));
    return Array.from(set).sort();
  }, [allMetrics]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...allMetrics];
    if (cityFilter) list = list.filter(m => m.city === cityFilter);
    if (profitFilter === 'profitable') list = list.filter(m => m.monthlyCF > 0);
    if (profitFilter === 'negative') list = list.filter(m => m.monthlyCF <= 0);
    list.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === 'asc' ? (Number(aVal) - Number(bVal)) : (Number(bVal) - Number(aVal));
    });
    return list;
  }, [allMetrics, cityFilter, profitFilter, sortKey, sortDir]);

  // Portfolio summary
  const summary = useMemo(() => {
    if (allMetrics.length === 0) return { count: 0, avgCap: 0, avgCoC: 0, totalCF: 0, profitable: 0 };
    const withPrice = allMetrics.filter(m => m.purchasePrice > 0);
    return {
      count: allMetrics.length,
      avgCap: withPrice.length > 0 ? withPrice.reduce((s, m) => s + m.capRate, 0) / withPrice.length : 0,
      avgCoC: withPrice.length > 0 ? withPrice.reduce((s, m) => s + m.cashOnCash, 0) / withPrice.length : 0,
      totalCF: allMetrics.reduce((s, m) => s + m.monthlyCF, 0),
      profitable: allMetrics.filter(m => m.monthlyCF > 0).length,
    };
  }, [allMetrics]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(m => m.id)));
  };

  const handleCreateComparisonSet = async () => {
    if (selected.size < 2) return;
    setCreatingSet(true);
    try {
      const cityList = [...new Set(filtered.filter(m => selected.has(m.id)).map(m => m.city).filter(Boolean))];
      const setName = cityList.length > 0 ? `${cityList.join(' vs ')} Comparison` : `Comparison ${new Date().toLocaleDateString()}`;
      const createRes = await api.post('/comparisons', { name: setName });
      const setId = createRes.data.data.comparisonSet.id;
      for (const propId of selected) {
        await api.post(`/comparisons/${setId}/add`, { savedPropertyId: propId }).catch(() => {});
      }
      navigate('/compare');
    } catch {
      alert('Failed to create comparison set');
    } finally { setCreatingSet(false); }
  };

  const SortHeader = ({ label, sortKeyVal, className = '' }: { label: string; sortKeyVal: SortKey; className?: string }) => (
    <th
      onClick={() => handleSort(sortKeyVal)}
      className={`px-3 py-3 text-xs font-semibold uppercase cursor-pointer hover:bg-gray-100 select-none ${className} ${sortKey === sortKeyVal ? 'text-indigo-700' : 'text-gray-500'}`}
    >
      {label} {sortKey === sortKeyVal ? (sortDir === 'asc' ? '▲' : '▼') : ''}
    </th>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Your investment portfolio overview</p>
          </div>
          <div className="flex items-center gap-3">
            {user?.credits_remaining != null && (
              <Link to="/settings/subscription" className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
                {user.credits_remaining} credits remaining
              </Link>
            )}
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <SummaryCard label="Properties" value={String(summary.count)} color="indigo" />
          <SummaryCard label="Avg Cap Rate" value={`${summary.avgCap.toFixed(1)}%`} color={summary.avgCap >= 7 ? 'green' : summary.avgCap >= 5 ? 'blue' : 'yellow'} />
          <SummaryCard label="Avg Cash-on-Cash" value={`${summary.avgCoC.toFixed(1)}%`} color={summary.avgCoC >= 8 ? 'green' : summary.avgCoC >= 5 ? 'blue' : 'yellow'} />
          <SummaryCard label="Total Monthly CF" value={fmt(summary.totalCF)} color={summary.totalCF >= 0 ? 'green' : 'red'} />
          <SummaryCard label="Profitable" value={`${summary.profitable}/${summary.count}`} color={summary.profitable === summary.count ? 'green' : 'yellow'} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <QuickAction label="New Analysis" icon="+" onClick={() => navigate('/property/new')} />
          <QuickAction label="Search Properties" icon="&#128269;" onClick={() => navigate('/search')} />
          <QuickAction label="Compare" icon="&#8596;" onClick={() => navigate('/compare')} />
          <QuickAction label="Pricing" icon="&#9734;" onClick={() => navigate('/pricing')} />
        </div>

        {/* Filters & Bulk Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-gray-900">Evaluated Properties</h2>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* City Filter */}
              {cities.length > 0 && (
                <select
                  value={cityFilter}
                  onChange={e => setCityFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Cities</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}

              {/* Profitability Filter */}
              <select
                value={profitFilter}
                onChange={e => setProfitFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Properties</option>
                <option value="profitable">Profitable Only</option>
                <option value="negative">Negative CF</option>
              </select>

              {/* Bulk Compare */}
              {selected.size >= 2 && (
                <button
                  onClick={handleCreateComparisonSet}
                  disabled={creatingSet}
                  className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creatingSet ? 'Creating...' : `Compare ${selected.size} Selected`}
                </button>
              )}
            </div>
          </div>

          {/* Properties Table */}
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-3 py-3 w-10">
                      <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    </th>
                    <SortHeader label="Property" sortKeyVal="address" className="text-left" />
                    <SortHeader label="City" sortKeyVal="city" className="text-left" />
                    <SortHeader label="Price" sortKeyVal="purchasePrice" className="text-right" />
                    <SortHeader label="Down Pmt" sortKeyVal="downPayment" className="text-right" />
                    <SortHeader label="Cap Rate" sortKeyVal="capRate" className="text-right" />
                    <SortHeader label="CoC %" sortKeyVal="cashOnCash" className="text-right" />
                    <SortHeader label="Monthly CF" sortKeyVal="monthlyCF" className="text-right" />
                    <SortHeader label="DSCR" sortKeyVal="dscr" className="text-right" />
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id} className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${selected.has(m.id) ? 'bg-indigo-50/40' : ''}`}>
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={m.address}>{m.address}</p>
                        <p className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">
                        {m.city ? `${m.city}${m.state ? `, ${m.state}` : ''}` : '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-right font-medium text-gray-900">{fmt(m.purchasePrice)}</td>
                      <td className="px-3 py-3 text-sm text-right text-gray-600">{m.downPayment > 0 ? fmt(m.downPayment) : '-'}</td>
                      <td className={`px-3 py-3 text-sm text-right font-semibold ${ratingColor(m.capRate, [7, 5])}`}>
                        {m.capRate > 0 ? `${m.capRate.toFixed(1)}%` : '-'}
                      </td>
                      <td className={`px-3 py-3 text-sm text-right font-semibold ${ratingColor(m.cashOnCash, [8, 5])}`}>
                        {m.cashOnCash !== 0 ? `${m.cashOnCash.toFixed(1)}%` : '-'}
                      </td>
                      <td className={`px-3 py-3 text-sm text-right font-semibold ${m.monthlyCF >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {fmt(m.monthlyCF)}
                      </td>
                      <td className={`px-3 py-3 text-sm text-right font-semibold ${ratingColor(m.dscr, [1.25, 1.0])}`}>
                        {m.dscr > 0 ? m.dscr.toFixed(2) : '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              sessionStorage.setItem('propertyInfo', JSON.stringify(m.raw.property_data));
                              sessionStorage.setItem('financingInfo', JSON.stringify(m.raw.financing_data));
                              sessionStorage.setItem('expenseInfo', JSON.stringify(m.raw.expense_data));
                              navigate('/property/dashboard');
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setComparePropertyId(m.id);
                              setComparePropertyAddress(m.address);
                              setCompareModalOpen(true);
                            }}
                            className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                          >
                            Compare
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-4xl mb-3">&#127968;</p>
              <p className="text-gray-500">
                {allMetrics.length === 0 ? 'No evaluations yet' : 'No properties match your filters'}
              </p>
              {allMetrics.length === 0 && (
                <button onClick={() => navigate('/property/new')} className="mt-4 text-indigo-600 font-medium hover:text-indigo-700">
                  Analyze Your First Property
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <AddToComparisonModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        savedPropertyId={comparePropertyId}
        propertyAddress={comparePropertyAddress}
      />
    </>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.indigo}`}>
      <p className="text-xs font-medium uppercase opacity-70">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

function QuickAction({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md hover:border-indigo-300 transition-all"
    >
      <span className="text-2xl" dangerouslySetInnerHTML={{ __html: icon }} />
      <p className="text-sm font-medium text-gray-700 mt-2">{label}</p>
    </button>
  );
}
