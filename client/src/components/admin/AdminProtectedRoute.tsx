import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import { authService } from '../../services/auth.service';

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'denied'>('loading');

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      setStatus('denied');
      return;
    }

    adminService.verifyAdmin()
      .then(() => setStatus('authorized'))
      .catch(() => {
        setStatus('denied');
      });
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Verifying admin access...</div>
      </div>
    );
  }

  if (status === 'denied') {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
