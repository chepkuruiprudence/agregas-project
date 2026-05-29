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
    
    // 🔴 DEBUG: Log entire response
    console.log('=== LOGIN RESPONSE ===', response);
    console.log('Response structure:', {
      hasToken: !!response.token,
      hasUser: !!response.user,
      userRole: response.user?.role,
      fullResponse: JSON.stringify(response, null, 2)
    });

    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('agregas_token', response.token);
    localStorage.setItem('agregas_user', JSON.stringify(response.user));

    // 🔴 DEBUG: Log what's in localStorage
    const stored = localStorage.getItem('agregas_user');
    console.log('Stored user:', JSON.parse(stored || '{}'));

    // Auto-redirect based on role
    const userRole = response.user?.role;
    console.log('Attempting redirect for role:', userRole);
    
    if (userRole === 'customer') {
      console.log('✓ Redirecting to customer dashboard');
      navigate('/dashboard/customer');
    } else if (userRole === 'retailer') {
      console.log('✓ Redirecting to retailer dashboard');
      navigate('/dashboard/retailer');
    } else if (userRole === 'brand_marketer') {
      console.log('✓ Redirecting to brand dashboard');
      navigate('/dashboard/brand');
    } else if (userRole === 'admin') {
      console.log('✓ Redirecting to admin dashboard');
      navigate('/dashboard/admin');
    } else {
      console.error('❌ Unknown role:', userRole);
      navigate('/');
    }
  } catch (error) {
    console.error('Login error:', error);
  } finally {
    setIsLoading(false);
  }
}, [navigate]);

// Same for register:
const register = useCallback(async (data: any) => {
  setIsLoading(true);
  try {
    console.log('=== REGISTER DATA SENT ===', data);
    const response = await authService.register(data);
    
    console.log('=== REGISTER RESPONSE ===', response);
    console.log('Response user role:', response.user?.role);

    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('agregas_token', response.token);
    localStorage.setItem('agregas_user', JSON.stringify(response.user));

    const userRole = response.user?.role;
    console.log('Attempting redirect for role:', userRole);
    
    if (userRole === 'customer') {
      navigate('/dashboard/customer');
    } else if (userRole === 'retailer') {
      navigate('/dashboard/retailer');
    } else if (userRole === 'brand_marketer') {
      navigate('/dashboard/brand');
    } else if (userRole === 'admin') {
      navigate('/dashboard/admin');
    }
  } catch (error) {
    console.error('Register error:', error);
    throw error;
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