import api from './api';

interface RegisterPayload {
  email: string;
  username?: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface UserData {
  id: string;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: UserData;
    token: string;
  };
}

interface RegisterResponse {
  success: boolean;
  data: UserData;
}

const TOKEN_KEY: string = import.meta.env.VITE_AUTH_STORAGE_KEY || 'auth_token';

export const authService = {
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    try {
      const response = await api.post<RegisterResponse>('/auth/register', payload);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', payload);
      if (response.data.data?.token) {
        localStorage.setItem(TOKEN_KEY, response.data.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
