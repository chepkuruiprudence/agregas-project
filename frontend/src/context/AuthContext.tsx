import React, { createContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LoginRequest, RegisterRequest } from '../types';
import { authService } from '../services/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('agregas_token');
    const storedUser = localStorage.getItem('agregas_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('agregas_token', response.token);
      localStorage.setItem('agregas_user', JSON.stringify(response.user));

      // Auto-redirect based on role
      if (response.user.role === 'customer') {
        navigate('/dashboard/customer');
      } else if (response.user.role === 'retailer') {
        navigate('/dashboard/retailer');
      } else if (response.user.role === 'brand_marketer') {
        navigate('/dashboard/brand');
      } else if (response.user.role === 'admin') {
        navigate('/dashboard/admin');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const register = useCallback(async (data: any) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('agregas_token', response.token);
      localStorage.setItem('agregas_user', JSON.stringify(response.user));

      // Auto-redirect based on role
      if (response.user.role === 'customer') {
        navigate('/dashboard/customer');
      } else if (response.user.role === 'retailer') {
        navigate('/dashboard/retailer');
      } else if (response.user.role === 'brand_marketer') {
        navigate('/dashboard/brand');
      } else if (response.user.role === 'admin') {
        navigate('/dashboard/admin');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setToken(null);
      setUser(null);
      localStorage.removeItem('agregas_token');
      localStorage.removeItem('agregas_user');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};