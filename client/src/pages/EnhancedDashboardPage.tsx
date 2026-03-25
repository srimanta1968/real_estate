import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
// AppLayout is provided by LayoutWrapper in App.tsx

interface DashboardData {
  totalProperties: number;
  totalComparisons: number;
  totalSearches: number;
  recentProperties: any[];
  pdfDownloads: { count: number; remaining: number; limit: number };
  tier: string;
}

const fmt = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

function computeQuickMetrics(properties: any[]) {
  if (properties.length === 0) return { avgCapRate: 0, avgCoC: 0, totalMonthlyCF: 0 };

  let totalCapRate = 0;
  let totalCoC = 0;
  let totalMonthlyCF = 0;
  let count = 0;

  properties.forEach(prop => {
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

    if (purchasePrice > 0) {
      totalCapRate += (noi / purchasePrice) * 100;
      count++;
    }
    if (downPayment > 0) totalCoC += (netCF / downPayment) * 100;
    totalMonthlyCF += netCF / 12;
  });

  return {
    avgCapRate: count > 0 ? totalCapRate / count : 0,
    avgCoC: count > 0 ? totalCoC / count : 0,
    totalMonthlyCF,
  };
}

export default function EnhancedDashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { replace: true }); return; }

    const load = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        setData(res.data.data);
      } catch {
        setData({ totalProperties: 0, totalComparisons: 0, totalSearches: 0, recentProperties: [], pdfDownloads: { count: 0, remaining: 5, limit: 5 }, tier: 'free' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </>
    );
  }

  const metrics = data ? computeQuickMetrics(data.recentProperties) : { avgCapRate: 0, avgCoC: 0, totalMonthlyCF: 0 };

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Your investment portfolio overview</p>
          </div>
          {data && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 text-center">
              <p className="text-sm font-medium text-indigo-700">
                {data.pdfDownloads.remaining}/{data.pdfDownloads.limit} PDFs remaining
              </p>
            </div>
          )}
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard label="Properties" value={String(data?.totalProperties || 0)} color="indigo" />
          <SummaryCard label="Avg Cap Rate" value={`${metrics.avgCapRate.toFixed(1)}%`} color={metrics.avgCapRate >= 7 ? 'green' : metrics.avgCapRate >= 5 ? 'blue' : 'yellow'} />
          <SummaryCard label="Avg Cash-on-Cash" value={`${metrics.avgCoC.toFixed(1)}%`} color={metrics.avgCoC >= 8 ? 'green' : metrics.avgCoC >= 5 ? 'blue' : 'yellow'} />
          <SummaryCard label="Total Monthly CF" value={fmt(metrics.totalMonthlyCF)} color={metrics.totalMonthlyCF >= 0 ? 'green' : 'red'} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <QuickAction label="New Analysis" icon="+" onClick={() => navigate('/property/new')} />
          <QuickAction label="Search Properties" icon="&#128269;" onClick={() => navigate('/search')} />
          <QuickAction label="Compare" icon="&#8596;" onClick={() => navigate('/compare')} />
          <QuickAction label="View All Properties" icon="&#128203;" onClick={() => navigate('/dashboard')} />
        </div>

        {/* Recent Evaluations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Recent Evaluations</h2>
            <Link to="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</Link>
          </div>
          {data && data.recentProperties.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {data.recentProperties.slice(0, 5).map((prop: any) => {
                const address = prop.property_data?.address || prop.property_name || 'Untitled';
                const price = parseFloat(prop.property_data?.purchase_price) || 0;
                const rent = parseFloat(prop.expense_data?.monthly_rental_income) || 0;

                return (
                  <div key={prop.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{address}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fmt(price)} | Rent: {fmt(rent)}/mo | {new Date(prop.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        sessionStorage.setItem('propertyInfo', JSON.stringify(prop.property_data));
                        sessionStorage.setItem('financingInfo', JSON.stringify(prop.financing_data));
                        sessionStorage.setItem('expenseInfo', JSON.stringify(prop.expense_data));
                        navigate('/property/dashboard');
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium ml-4"
                    >
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-4xl mb-3">&#127968;</p>
              <p className="text-gray-500">No evaluations yet</p>
              <button onClick={() => navigate('/property/new')} className="mt-4 text-indigo-600 font-medium hover:text-indigo-700">
                Analyze Your First Property
              </button>
            </div>
          )}
        </div>
      </div>
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
      <p className="text-2xl font-bold mt-1">{value}</p>
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
