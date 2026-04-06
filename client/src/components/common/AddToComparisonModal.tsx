import { useState, useEffect } from 'react';
import api from '../../services/api';

interface AddToComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPropertyId: string;
  propertyAddress?: string;
}

interface ComparisonSet {
  id: string;
  name: string;
  created_at: string;
}

export default function AddToComparisonModal({ isOpen, onClose, savedPropertyId, propertyAddress }: AddToComparisonModalProps) {
  const [sets, setSets] = useState<ComparisonSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState('');
  const [newSetName, setNewSetName] = useState('');
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setNewSetName('');
      setSelectedSetId('');
      fetchSets();
    }
  }, [isOpen]);

  const fetchSets = async () => {
    setFetching(true);
    try {
      const res = await api.get('/comparisons');
      const fetched = res.data.data?.comparisonSets || [];
      setSets(fetched);
      if (fetched.length > 0) {
        setSelectedSetId(fetched[0].id);
        setMode('select');
      } else {
        setMode('create');
      }
    } catch {
      setError('Failed to load comparison sets');
    } finally {
      setFetching(false);
    }
  };

  const handleAdd = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let setId = selectedSetId;

      if (mode === 'create') {
        if (!newSetName.trim()) {
          setError('Please enter a name for the new set');
          setLoading(false);
          return;
        }
        const createRes = await api.post('/comparisons', { name: newSetName.trim() });
        setId = createRes.data.data.comparisonSet.id;
      }

      if (!setId) {
        setError('Please select or create a comparison set');
        setLoading(false);
        return;
      }

      await api.post(`/comparisons/${setId}/add`, { savedPropertyId });
      setSuccess('Property added to comparison set!');
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to add property';
      if (msg.includes('limit') || msg.includes('maximum')) {
        setError('Comparison set limit reached. Upgrade your plan for more properties per set.');
      } else if (msg.includes('already')) {
        setError('This property is already in the comparison set.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Add to Comparison</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {propertyAddress && (
          <p className="text-sm text-gray-500 mb-4 truncate" title={propertyAddress}>
            Property: <span className="font-medium text-gray-700">{propertyAddress}</span>
          </p>
        )}

        {fetching ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : (
          <>
            {sets.length > 0 && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setMode('select')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border ${mode === 'select' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  Existing Set
                </button>
                <button
                  onClick={() => setMode('create')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border ${mode === 'create' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  New Set
                </button>
              </div>
            )}

            {mode === 'select' && sets.length > 0 ? (
              <select
                value={selectedSetId}
                onChange={e => setSelectedSetId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 mb-4"
              >
                {sets.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={newSetName}
                onChange={e => setNewSetName(e.target.value)}
                placeholder="Enter comparison set name..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 mb-4"
                onKeyDown={e => e.key === 'Enter' && !loading && handleAdd()}
                autoFocus
              />
            )}

            {error && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                {success}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={loading || !!success}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add to Set'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
