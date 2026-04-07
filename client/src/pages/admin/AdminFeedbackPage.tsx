import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/admin.service';

interface Feedback {
  id: string;
  user_id: string;
  user_email: string;
  first_name: string | null;
  last_name: string | null;
  type: string;
  rating: number | null;
  subject: string | null;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUS_OPTIONS = ['all', 'new', 'reviewed', 'resolved', 'archived'];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-900 text-blue-300',
  reviewed: 'bg-yellow-900 text-yellow-300',
  resolved: 'bg-green-900 text-green-300',
  archived: 'bg-gray-700 text-gray-400',
};

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getFeedback(page, 20, statusFilter);
      setFeedback(data.feedback);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { loadFeedback(); }, [loadFeedback]);

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    await adminService.updateFeedback(feedbackId, { status: newStatus });
    loadFeedback();
  };

  const handleSaveNotes = async (feedbackId: string) => {
    await adminService.updateFeedback(feedbackId, { admin_notes: adminNotes });
    setExpandedId(null);
    loadFeedback();
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-gray-600">No rating</span>;
    return (
      <span className="text-yellow-400">
        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
      </span>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Feedback ({total})</h1>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-20">Loading feedback...</div>
      ) : feedback.length === 0 ? (
        <div className="text-gray-500 text-center py-20">No feedback found</div>
      ) : (
        <div className="space-y-4">
          {feedback.map(fb => (
            <div key={fb.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{fb.user_email}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[fb.status] || 'bg-gray-700 text-gray-400'}`}>
                      {fb.status}
                    </span>
                    <span className="text-xs text-gray-500 capitalize bg-gray-700 px-2 py-0.5 rounded">
                      {fb.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {renderStars(fb.rating)}
                    <span className="text-gray-500 text-xs">{new Date(fb.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {fb.subject && <p className="text-gray-300 font-medium mb-1">{fb.subject}</p>}
                <p className="text-gray-400 text-sm whitespace-pre-wrap">{fb.message}</p>

                {fb.admin_notes && (
                  <div className="mt-3 p-3 bg-gray-900 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Admin notes:</p>
                    <p className="text-gray-300 text-sm">{fb.admin_notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4">
                  <select
                    value={fb.status}
                    onChange={e => handleStatusChange(fb.id, e.target.value)}
                    className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                  >
                    {STATUS_OPTIONS.filter(s => s !== 'all').map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setExpandedId(expandedId === fb.id ? null : fb.id);
                      setAdminNotes(fb.admin_notes || '');
                    }}
                    className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                  >
                    {expandedId === fb.id ? 'Cancel' : 'Add Note'}
                  </button>
                </div>

                {expandedId === fb.id && (
                  <div className="mt-3 flex gap-2">
                    <textarea
                      value={adminNotes}
                      onChange={e => setAdminNotes(e.target.value)}
                      rows={2}
                      placeholder="Add admin notes..."
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 resize-y"
                    />
                    <button
                      onClick={() => handleSaveNotes(fb.id)}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 self-end"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
}
