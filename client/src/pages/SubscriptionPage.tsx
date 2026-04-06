import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface UsageData {
  tier: string;
  used: number;
  limit: number;
  remaining: number;
  lifetimeReportUsed: boolean;
  periodStart: string | null;
  periodEnd: string | null;
  history: { id: string; property_address: string; report_type: string; credits_consumed: number; created_at: string }[];
}

const PLAN_DETAILS: Record<string, { name: string; price: number; credits: string }> = {
  free: { name: 'Free', price: 0, credits: '1 lifetime report' },
  starter: { name: 'Starter', price: 25, credits: '10 credits/month' },
  growth: { name: 'Growth', price: 75, credits: '50 credits/month' },
  premium: { name: 'Premium', price: 100, credits: '100 credits/month' },
};

export default function SubscriptionPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { replace: true }); return; }
    loadUsage();
  }, [isAuthenticated]);

  const loadUsage = async () => {
    try {
      const res = await api.get('/subscriptions/usage');
      setUsage(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await api.post('/subscriptions/create-portal');
      window.location.href = res.data.data.url;
    } catch {
      alert('Unable to open subscription management. Please try again.');
    } finally { setPortalLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!usage) return null;

  const plan = PLAN_DETAILS[usage.tier] || PLAN_DETAILS.free;
  const usagePct = usage.limit > 0 ? Math.min((usage.used / usage.limit) * 100, 100) : 0;

  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription & Usage</h1>
          <p className="mt-1 text-gray-500">Manage your plan and track credit usage</p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
              <p className="text-emerald-600 font-medium">{plan.credits}</p>
              {plan.price > 0 && <p className="text-sm text-gray-400 mt-1">${plan.price}/month</p>}
              {usage.periodEnd && (
                <p className="text-xs text-gray-400 mt-1">
                  Renews {new Date(usage.periodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {usage.tier !== 'free' && (
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  {portalLoading ? 'Loading...' : 'Manage Subscription'}
                </button>
              )}
              <Link
                to="/pricing"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
              >
                {usage.tier === 'free' ? 'Upgrade Plan' : 'Change Plan'}
              </Link>
            </div>
          </div>
        </div>

        {/* Credit Usage Meter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Credit Usage</h3>
          {usage.tier === 'free' ? (
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${usage.lifetimeReportUsed ? 'bg-gray-300' : 'bg-emerald-500'}`} />
              <p className="text-sm text-gray-700">
                {usage.lifetimeReportUsed
                  ? 'Your 1 free lifetime report has been used.'
                  : 'You have 1 free lifetime report available.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{usage.used}</span> of {usage.limit} credits used this month
                </span>
                <span className={`text-sm font-semibold ${usage.remaining <= 2 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {usage.remaining} remaining
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usagePct > 90 ? 'bg-red-500' : usagePct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">
                  Each property in a report uses 1 credit. A 3-property comparison uses 3 credits.
                </p>
                {usage.periodEnd && (
                  <p className="text-xs text-gray-500 flex-shrink-0 ml-4">
                    Credits reset: <span className="font-medium">{new Date(usage.periodEnd).toLocaleDateString()}</span>
                  </p>
                )}
              </div>
              {usage.remaining <= 2 && usage.remaining > 0 && (
                <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  You're running low on credits. <Link to="/pricing" className="font-semibold underline">Upgrade your plan</Link> for more.
                </div>
              )}
              {usage.remaining === 0 && (
                <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  No credits remaining this month. <Link to="/pricing" className="font-semibold underline">Upgrade now</Link> or wait for reset on {usage.periodEnd ? new Date(usage.periodEnd).toLocaleDateString() : 'next billing date'}.
                </div>
              )}
            </>
          )}
        </div>

        {/* Usage History */}
        {usage.history.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Usage</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-xs text-gray-500 uppercase">
                    <th className="text-left py-2 px-3">Property</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-center py-2 px-3">Credits</th>
                    <th className="text-right py-2 px-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.history.map(h => (
                    <tr key={h.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-sm text-gray-900 truncate max-w-[250px]">{h.property_address || 'Unknown'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${h.report_type === 'comparison' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {h.report_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-sm text-gray-700">{h.credits_consumed}</td>
                      <td className="py-2.5 px-3 text-right text-xs text-gray-400">
                        {new Date(h.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
