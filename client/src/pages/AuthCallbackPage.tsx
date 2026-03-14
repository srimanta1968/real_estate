import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        missing_code: 'Authorization code was not provided.',
        token_exchange_failed: 'Failed to authenticate with provider.',
        profile_fetch_failed: 'Failed to retrieve your profile.',
        account_deactivated: 'Your account has been deactivated.',
        oauth_failed: 'Authentication failed. Please try again.',
      };
      setError(errorMessages[errorParam] || 'Authentication failed.');
      return;
    }

    if (token) {
      login(token);
      const hasPending = sessionStorage.getItem('pendingPdfExport');
      if (hasPending) {
        sessionStorage.removeItem('pendingPdfExport');
        navigate('/property/scenarios', { replace: true });
      } else {
        navigate('/property/dashboard', { replace: true });
      }
    }
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          <div className="text-red-500 text-4xl mb-4">!</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/property/scenarios')}
            className="bg-indigo-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
        <p className="text-gray-500">Completing sign in...</p>
      </div>
    </div>
  );
}
