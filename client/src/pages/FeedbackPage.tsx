import { useState, useEffect } from 'react';
import api from '../services/api';

const FEEDBACK_TYPES = [
  { value: 'general', label: 'General Feedback' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'usability', label: 'Usability' },
  { value: 'pricing', label: 'Pricing' },
];

interface FeedbackItem {
  id: string;
  type: string;
  rating: number | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
}

export default function FeedbackPage() {
  const [type, setType] = useState('general');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<FeedbackItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    api.get('/feedback/my')
      .then(res => setHistory(res.data.data || []))
      .catch(() => {});
  }, [submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter your feedback');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/feedback', {
        type,
        rating: rating || undefined,
        subject: subject || undefined,
        message,
      });
      setSubmitted(true);
      setMessage('');
      setSubject('');
      setRating(0);
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Share Your Feedback</h1>
      <p className="text-gray-500 mb-6">Help us improve DealEval by sharing your thoughts, reporting bugs, or requesting features.</p>

      {submitted && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          Thank you for your feedback! We'll review it shortly.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
        )}

        {/* Feedback type */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Type</label>
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_TYPES.map(ft => (
              <button
                key={ft.value}
                type="button"
                onClick={() => setType(ft.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  type === ft.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {ft.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate your experience? <span className="text-gray-400">(optional)</span>
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star === rating ? 0 : star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-3xl transition-colors"
              >
                <span className={(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'}>
                  {'\u2605'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Brief summary of your feedback"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Message */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Feedback *</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            required
            placeholder="Tell us what you think, report a bug, or suggest a feature..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>

      {/* Feedback history */}
      {history.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-4"
          >
            {showHistory ? 'Hide' : 'Show'} your previous feedback ({history.length})
          </button>

          {showHistory && (
            <div className="space-y-3">
              {history.map(fb => (
                <div key={fb.id} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">{fb.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        fb.status === 'new' ? 'bg-blue-50 text-blue-600' :
                        fb.status === 'reviewed' ? 'bg-yellow-50 text-yellow-600' :
                        fb.status === 'resolved' ? 'bg-green-50 text-green-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {fb.status}
                      </span>
                      {fb.rating && (
                        <span className="text-yellow-400 text-sm">
                          {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400 text-xs">{new Date(fb.created_at).toLocaleDateString()}</span>
                  </div>
                  {fb.subject && <p className="text-gray-800 font-medium text-sm mb-1">{fb.subject}</p>}
                  <p className="text-gray-600 text-sm">{fb.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
