import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  recentSignups: number;
  planBreakdown: { tier: string; count: number }[];
  pendingFeedback: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-400 text-center py-20">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="text-red-400 text-center py-20">Failed to load dashboard</div>;
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, color: 'bg-blue-600' },
    { label: 'Active Users', value: stats.activeUsers, color: 'bg-green-600' },
    { label: 'Suspended', value: stats.suspendedUsers, color: 'bg-yellow-600' },
    { label: 'New (7 days)', value: stats.recentSignups, color: 'bg-purple-600' },
    { label: 'Pending Feedback', value: stats.pendingFeedback, color: 'bg-red-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center text-white text-sm font-bold mb-3`}>
              {card.value}
            </div>
            <p className="text-gray-400 text-sm">{card.label}</p>
            <p className="text-white text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Subscription Plan Breakdown</h2>
          {stats.planBreakdown.length === 0 ? (
            <p className="text-gray-500 text-sm">No users yet</p>
          ) : (
            <div className="space-y-3">
              {stats.planBreakdown.map(p => (
                <div key={p.tier} className="flex items-center justify-between">
                  <span className="text-gray-300 capitalize">{p.tier || 'free'}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (p.count / stats.totalUsers) * 100)}%` }}
                      />
                    </div>
                    <span className="text-white font-medium w-8 text-right">{p.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              to="/admin/users"
              className="flex items-center gap-3 px-4 py-3 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
            >
              <span className="text-lg">{'\u263A'}</span>
              Manage Users
            </Link>
            <Link
              to="/admin/revenue"
              className="flex items-center gap-3 px-4 py-3 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
            >
              <span className="text-lg">$</span>
              View Revenue
            </Link>
            <Link
              to="/admin/feedback"
              className="flex items-center gap-3 px-4 py-3 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
            >
              <span className="text-lg">{'\u2709'}</span>
              Review Feedback
              {stats.pendingFeedback > 0 && (
                <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.pendingFeedback}
                </span>
              )}
            </Link>
            <Link
              to="/admin/emails"
              className="flex items-center gap-3 px-4 py-3 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
            >
              <span className="text-lg">{'\u2192'}</span>
              Send Onboarding Email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
