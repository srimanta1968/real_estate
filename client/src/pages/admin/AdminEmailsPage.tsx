import { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_first_name: string | null;
  email_type: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
}

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Quick send form
  const [users, setUsers] = useState<{ id: string; email: string; first_name: string | null }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [subject, setSubject] = useState('Welcome to DealEval!');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([
      adminService.getEmailLog(),
      adminService.getUsers(1, 100),
    ]).then(([emailData, userData]) => {
      setEmails(emailData);
      setUsers(userData.users.map((u: any) => ({ id: u.id, email: u.email, first_name: u.first_name })));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async () => {
    if (!selectedUserId || !subject || !body) {
      alert('Please fill all fields');
      return;
    }
    setSending(true);
    try {
      await adminService.sendOnboardingEmail(selectedUserId, subject, body);
      const updated = await adminService.getEmailLog();
      setEmails(updated);
      setShowForm(false);
      setSelectedUserId('');
      setBody('');
    } catch (err) {
      alert('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="text-gray-400 text-center py-20">Loading email log...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Onboarding Emails</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'New Email'}
        </button>
      </div>

      {/* Send email form */}
      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Send Onboarding Email</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Recipient</label>
              <select
                value={selectedUserId}
                onChange={e => {
                  setSelectedUserId(e.target.value);
                  const user = users.find(u => u.id === e.target.value);
                  if (user) {
                    setBody(`Hi ${user.first_name || 'there'},\n\nWelcome to DealEval! We're excited to have you on board.\n\nDealEval helps you evaluate real estate deals with professional-grade financial analysis tools.\n\nHere's how to get started:\n1. Search for properties or enter your own deal\n2. Run a full financial analysis (Cap Rate, IRR, Cash Flow)\n3. Compare multiple properties side by side\n\nFeel free to reach out if you have any questions!\n\nBest,\nThe DealEval Team`);
                  }
                }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="">Select user...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1">Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm resize-y"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={sending || !selectedUserId}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      )}

      {/* Email log */}
      {emails.length === 0 ? (
        <div className="text-gray-500 text-center py-20">No emails sent yet</div>
      ) : (
        <div className="space-y-3">
          {emails.map(email => (
            <div key={email.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-750"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white">{email.recipient_email}</span>
                  <span className="text-gray-500 text-sm">-</span>
                  <span className="text-gray-300 text-sm">{email.subject}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-green-900 text-green-300">{email.status}</span>
                  <span className="text-gray-500 text-xs">{new Date(email.created_at).toLocaleString()}</span>
                </div>
              </button>
              {expandedId === email.id && (
                <div className="px-4 pb-4 border-t border-gray-700 pt-3">
                  <pre className="text-gray-400 text-sm whitespace-pre-wrap font-sans">{email.body}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
