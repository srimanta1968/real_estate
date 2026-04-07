import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ADMIN_NAV = [
  { path: '/admin', label: 'Dashboard', icon: '\u25A1' },
  { path: '/admin/users', label: 'Users', icon: '\u263A' },
  { path: '/admin/revenue', label: 'Revenue', icon: '$' },
  { path: '/admin/feedback', label: 'Feedback', icon: '\u2709' },
  { path: '/admin/emails', label: 'Onboarding Emails', icon: '\u2192' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-gray-800 border-r border-gray-700 fixed h-full z-30">
        <div className="p-6">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">A</span>
            <span className="text-lg font-bold text-white">DealEval Admin</span>
          </Link>
        </div>
        <nav className="flex-1 px-4">
          {ADMIN_NAV.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-red-600/20 text-red-400'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            &larr; Back to App
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors w-full text-left mt-1"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-800 z-50 shadow-xl">
            <div className="p-6 flex justify-between items-center">
              <span className="text-lg font-bold text-white">Admin</span>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 text-xl">&times;</button>
            </div>
            <nav className="px-4">
              {ADMIN_NAV.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-sm font-medium ${
                    location.pathname === item.path
                      ? 'bg-red-600/20 text-red-400'
                      : 'text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-700 mt-4">
              <button onClick={handleLogout} className="text-sm text-red-400 px-4 py-2">Sign Out</button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white text-xl"
            >
              &#9776;
            </button>
            <div className="text-sm text-gray-400">
              Admin Panel
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
