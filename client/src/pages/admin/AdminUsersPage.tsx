import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/admin.service';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  subscription_tier: string | null;
  subscription_status: string | null;
  credits_used_this_period: number;
  credits_limit: number;
  lifetime_report_used: boolean;
  last_login: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Grant credits modal
  const [grantModal, setGrantModal] = useState<{ userId: string; email: string } | null>(null);
  const [grantCredits, setGrantCredits] = useState(5);
  const [grantReason, setGrantReason] = useState('');

  // Email modal
  const [emailModal, setEmailModal] = useState<{ userId: string; email: string } | null>(null);
  const [emailSubject, setEmailSubject] = useState('Welcome to DealEval!');
  const [emailBody, setEmailBody] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers(page, 20, search || undefined);
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleSuspend = async (userId: string) => {
    if (!confirm('Suspend this user?')) return;
    await adminService.suspendUser(userId);
    loadUsers();
  };

  const handleActivate = async (userId: string) => {
    await adminService.activateUser(userId);
    loadUsers();
  };

  const handleGrantCredits = async () => {
    if (!grantModal) return;
    try {
      await adminService.grantCredits(grantModal.userId, grantCredits, grantReason);
      setGrantModal(null);
      setGrantCredits(5);
      setGrantReason('');
      loadUsers();
    } catch (err) {
      alert('Failed to grant credits');
    }
  };

  const handleSendEmail = async () => {
    if (!emailModal) return;
    try {
      await adminService.sendOnboardingEmail(emailModal.userId, emailSubject, emailBody);
      alert('Onboarding email logged successfully');
      setEmailModal(null);
      setEmailSubject('Welcome to DealEval!');
      setEmailBody('');
    } catch (err) {
      alert('Failed to send email');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Users ({total})</h1>
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-72 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-red-500"
        />
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-20">Loading users...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Plan</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Credits</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Joined</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-white">{user.email}</td>
                    <td className="py-3 px-4 text-gray-300">
                      {user.first_name || user.last_name
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        user.subscription_tier === 'premium' ? 'bg-purple-900 text-purple-300' :
                        user.subscription_tier === 'growth' ? 'bg-blue-900 text-blue-300' :
                        user.subscription_tier === 'starter' ? 'bg-green-900 text-green-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {(user.subscription_tier || 'free').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {user.credits_used_this_period}/{user.credits_limit || 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-gray-300">{user.is_active ? 'Active' : 'Suspended'}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setGrantModal({ userId: user.id, email: user.email })}
                          className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          title="Grant trial credits"
                        >
                          +Credits
                        </button>
                        <button
                          onClick={() => {
                            setEmailModal({ userId: user.id, email: user.email });
                            setEmailBody(`Hi ${user.first_name || 'there'},\n\nWelcome to DealEval! We're excited to have you on board.\n\nDealEval helps you evaluate real estate deals with professional-grade financial analysis tools.\n\nHere's how to get started:\n1. Search for properties or enter your own deal\n2. Run a full financial analysis (Cap Rate, IRR, Cash Flow)\n3. Compare multiple properties side by side\n\nFeel free to reach out if you have any questions!\n\nBest,\nThe DealEval Team`);
                          }}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          title="Send onboarding email"
                        >
                          Email
                        </button>
                        {user.is_active ? (
                          <button
                            onClick={() => handleSuspend(user.id)}
                            className="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/40"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(user.id)}
                            className="px-2 py-1 text-xs bg-green-600/20 text-green-400 rounded hover:bg-green-600/40"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded disabled:opacity-40 hover:bg-gray-700"
              >
                Prev
              </button>
              <span className="text-gray-400 text-sm">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded disabled:opacity-40 hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Grant Credits Modal */}
      {grantModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-1">Grant Trial Credits</h3>
            <p className="text-gray-400 text-sm mb-4">User: {grantModal.email}</p>

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-1">Number of credits</label>
              <input
                type="number"
                min={1}
                max={100}
                value={grantCredits}
                onChange={e => setGrantCredits(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-1">Reason (optional)</label>
              <input
                type="text"
                value={grantReason}
                onChange={e => setGrantReason(e.target.value)}
                placeholder="e.g., Trial extension, customer request"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setGrantModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
                Cancel
              </button>
              <button onClick={handleGrantCredits} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Grant {grantCredits} Credits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {emailModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-1">Send Onboarding Email</h3>
            <p className="text-gray-400 text-sm mb-4">To: {emailModal.email}</p>

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-1">Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-1">Body</label>
              <textarea
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm resize-y"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setEmailModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
                Cancel
              </button>
              <button onClick={handleSendEmail} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
