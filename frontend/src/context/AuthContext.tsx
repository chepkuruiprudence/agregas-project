import React, { createContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginRequest, RegisterRequest } from '../types';
import { authService } from '../services/auth';
import { useNotifications } from '../hooks/useNotifications';

interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: 'customer' | 'retailer' | 'brand_marketer' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  /**
   * Initialize auth from localStorage on mount
   * This allows users to stay logged in on page refresh
   */
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('agregas_token');
        const storedUser = localStorage.getItem('agregas_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          console.log('✓ User already authenticated:', storedUser);
        } else {
          console.log('ℹ️ No stored auth, user is logged out');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('agregas_token');
        localStorage.removeItem('agregas_user');
        addNotification('Session error, please login again', 'error');
      } finally {
        // Always set loading to false after check
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [addNotification]);

  /**
   * Login with email and password
   * Auto-redirects to dashboard based on user role
   */
  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        setIsLoading(true);
        console.log('🔐 Login attempt:', credentials.email);

        const response = await authService.login(credentials);

        console.log('=== LOGIN RESPONSE ===');
        console.log('Token:', response.token?.substring(0, 20) + '...');
        console.log('User:', response.user);

        // Store token and user in localStorage
        localStorage.setItem('agregas_token', response.token);
        localStorage.setItem('agregas_user', JSON.stringify(response.user));

        setToken(response.token);
        setUser(response.user);

        console.log('✓ Login successful for role:', response.user.role);
        addNotification('Login successful!', 'success');

        // Auto-redirect based on role
        const dashboardRoutes: Record<string, string> = {
          customer: '/dashboard/customer',
          retailer: '/dashboard/retailer',
          brand_marketer: '/dashboard/brand',
          admin: '/dashboard/admin',
        };

        const dashboardUrl = dashboardRoutes[response.user.role] || '/dashboard/customer';
        console.log('✓ Redirecting to', dashboardUrl);
        navigate(dashboardUrl);
      } catch (error: any) {
        console.error('❌ Login error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Login failed';
        addNotification(errorMessage, 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, addNotification]
  );

  /**
   * Register new user
   * Auto-redirects to dashboard based on role
   */
  const register = useCallback(
    async (data: any) => {
      try {
        setIsLoading(true);
        console.log('=== REGISTER DATA SENT ===');
        console.log(data);

        const response = await authService.register(data);

        console.log('=== REGISTER RESPONSE ===');
        console.log('Token:', response.token?.substring(0, 20) + '...');
        console.log('User:', response.user);

        // Store token and user in localStorage
        localStorage.setItem('agregas_token', response.token);
        localStorage.setItem('agregas_user', JSON.stringify(response.user));

        setToken(response.token);
        setUser(response.user);

        console.log('✓ Registration successful for role:', response.user.role);
        addNotification('Welcome to AGREGAS! Registration successful!', 'success');

        // Auto-redirect based on role
        const dashboardRoutes: Record<string, string> = {
          customer: '/dashboard/customer',
          retailer: '/dashboard/retailer',
          brand_marketer: '/dashboard/brand',
          admin: '/dashboard/admin',
        };

        const dashboardUrl = dashboardRoutes[response.user.role] || '/dashboard/customer';
        console.log('✓ Redirecting to', dashboardUrl);
        navigate(dashboardUrl);
      } catch (error: any) {
        console.error('❌ Register error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
        addNotification(errorMessage, 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, addNotification]
  );

  /**
   * Logout user
   * Clears token, user, and redirects to home
   */
  const logout = useCallback(() => {
    try {
      console.log('🚪 Logging out...');
      authService.logout();
      setToken(null);
      setUser(null);
      localStorage.removeItem('agregas_token');
      localStorage.removeItem('agregas_user');
      addNotification('Logged out successfully', 'success');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      addNotification('Error logging out', 'error');
    }
  }, [navigate, addNotification]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};