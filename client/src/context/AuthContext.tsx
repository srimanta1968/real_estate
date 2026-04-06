import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { syncTokenToExtension, clearTokenFromExtension } from '../services/extension-auth.service';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  subscription_tier?: string;
  credits_remaining?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user?: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(authService.getToken());
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      try {
        // Decode JWT payload to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        const baseUser = { id: payload.userId, email: payload.email, first_name: null, last_name: null, role: payload.role };
        setUser(baseUser);

        // Auto-sync token to Chrome extension on page load
        syncTokenToExtension(token, baseUser.email);

        // Fetch subscription tier from API (not in JWT)
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        fetch(`${API_BASE}/subscriptions/usage`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.data) {
              setUser(prev => prev ? { ...prev, subscription_tier: data.data.tier, credits_remaining: data.data.remaining } : prev);
            }
          })
          .catch(() => {});
      } catch {
        setToken(null);
        authService.logout();
      }
    }
  }, [token]);

  const login = (newToken: string, userData?: User) => {
    localStorage.setItem(import.meta.env.VITE_AUTH_STORAGE_KEY || 'auth_token', newToken);
    setToken(newToken);
    if (userData) setUser(userData);
    // Auto-sync token to Chrome extension (fire-and-forget)
    syncTokenToExtension(newToken, userData?.email);
  };

  const logout = () => {
    authService.logout();
    clearTokenFromExtension();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
