import { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';

interface RevenueData {
  mrr: number;
  totalSubscribers: number;
  breakdown: { tier: string; subscribers: number; pricePerUser: number; monthlyRevenue: number }[];
  signupTrend: { month: string; signups: number }[];
  monthlyCreditsUsed: number;
  monthlyReportsGenerated: number;
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getRevenueOverview()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-center py-20">Loading revenue data...</div>;
  if (!data) return <div className="text-red-400 text-center py-20">Failed to load revenue data</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Revenue Overview</h1>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <p className="text-gray-400 text-sm">Monthly Recurring Revenue</p>
          <p className="text-white text-3xl font-bold mt-1">${data.mrr.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <p className="text-gray-400 text-sm">Paying Subscribers</p>
          <p className="text-white text-3xl font-bold mt-1">{data.totalSubscribers}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <p className="text-gray-400 text-sm">Credits Used (This Month)</p>
          <p className="text-white text-3xl font-bold mt-1">{data.monthlyCreditsUsed}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <p className="text-gray-400 text-sm">Reports Generated (This Month)</p>
          <p className="text-white text-3xl font-bold mt-1">{data.monthlyReportsGenerated}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue breakdown by plan */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Revenue by Plan</h2>
          {data.breakdown.length === 0 ? (
            <p className="text-gray-500 text-sm">No paying subscribers yet</p>
          ) : (
            <div className="space-y-4">
              {data.breakdown.map(b => (
                <div key={b.tier} className="flex items-center justify-between">
                  <div>
                    <span className="text-white capitalize font-medium">{b.tier}</span>
                    <span className="text-gray-500 text-sm ml-2">({b.subscribers} users x ${b.pricePerUser}/mo)</span>
                  </div>
                  <span className="text-green-400 font-semibold">${b.monthlyRevenue.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-gray-700 pt-3 flex items-center justify-between">
                <span className="text-white font-semibold">Total MRR</span>
                <span className="text-green-400 font-bold text-lg">${data.mrr.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Signup trend */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Signup Trend (Last 6 Months)</h2>
          {data.signupTrend.length === 0 ? (
            <p className="text-gray-500 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.signupTrend.map(s => {
                const maxSignups = Math.max(...data.signupTrend.map(t => t.signups), 1);
                return (
                  <div key={s.month} className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-20">{s.month}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-4">
                      <div
                        className="bg-indigo-500 h-4 rounded-full transition-all"
                        style={{ width: `${(s.signups / maxSignups) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-medium w-8 text-right">{s.signups}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
