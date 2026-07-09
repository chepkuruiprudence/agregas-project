// frontend/src/context/AuthContext.tsx
import React, { createContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { authService } from '../services/auth';
import type { User, LoginRequest, SignupRequest, AuthContextType } from './AuthContext.types.ts';

export { type AuthContextType, type LoginRequest, type SignupRequest } from './AuthContext.types.ts';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('agregas_token');
        const storedUser = localStorage.getItem('agregas_user');

        if (
          !storedToken || storedToken === 'null' || storedToken === 'undefined' ||
          !storedUser  || storedUser  === 'null' || storedUser  === 'undefined'
        ) {
          localStorage.removeItem('agregas_token');
          localStorage.removeItem('agregas_user');
          setToken(null);
          setUser(null);
          return;
        }

        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        console.log('✓ User already authenticated');
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('agregas_token');
        localStorage.removeItem('agregas_user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const redirectToDashboard = (userRole: string) => {
    const routes: Record<string, string> = {
      customer: '/dashboard/customer',
      retailer: '/dashboard/retailer',
      brand: '/dashboard/brand',
      admin: '/dashboard/admin',
    };
    navigate(routes[userRole] || '/dashboard/customer');
  };

  const storeAuth = (newToken: string, newUser: User) => {
    localStorage.setItem('agregas_token', newToken);
    localStorage.setItem('agregas_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        setIsLoading(true);
        const response = await authService.login(credentials);
        storeAuth(response.token, response.user);
        addNotification('Login successful!', 'success');
        redirectToDashboard(response.user.role);
      } catch (error: any) {
        addNotification(error.response?.data?.message || 'Login failed', 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  const signup = useCallback(
    async (email: string, password: string, fullName: string, phone: string, role: string, extraData?: any) => {
      try {
        setIsLoading(true);
        await authService.signup({ email, password, fullName, phone, role });
        addNotification('OTP sent to your email. Check your inbox!', 'success');
        
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`, {
          state: {
            password,
            fullName,
            phone,
            role,
            extraFields: extraData
          }
        });
      } catch (error: any) {
        addNotification(error.response?.data?.message || 'Signup failed', 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, addNotification]
  );

  // Unified wrapper registration mapper callback configuration 
  const register = useCallback(
    async (data: any) =>
      signup(data.email, data.password, data.fullName, data.phone, data.role, data),
    [signup]
  );

  const verifyOTP = useCallback(
    async (email: string, otpCode: string, password: string, fullName: string, phone: string, role: string) => {
      try {
        setIsLoading(true);
        const response = await authService.verifyOTP({ email, otpCode, password, fullName, phone, role });
        storeAuth(response.token, response.user);
        addNotification('Account verified and created successfully!', 'success');
        redirectToDashboard(response.user.role);
      } catch (error: any) {
        addNotification(error.response?.data?.message || 'OTP verification failed', 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  const resendOTP = useCallback(
    async (email: string) => {
      try {
        setIsLoading(true);
        await authService.resendOTP(email);
        addNotification('OTP resent to your email!', 'success');
      } catch (error: any) {
        addNotification(error.response?.data?.message || 'Failed to resend OTP', 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  const loginWithGoogle = useCallback(
    async (googleProfile?: any) => {
      try {
        setIsLoading(true);
        const profile = googleProfile || (await initiateGoogleOAuth());
        const response = await authService.googleOAuthCallback(profile);
        storeAuth(response.token, response.user);
        addNotification(
          response.isNewUser ? 'Account created with Google!' : 'Google login successful!',
          'success'
        );
        redirectToDashboard(response.user.role);
      } catch (error: any) {
        addNotification(error.response?.data?.message || 'Google authentication failed', 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  const signupWithGoogle = useCallback(
    async (googleProfile?: any) => loginWithGoogle(googleProfile),
    [loginWithGoogle]
  );

  const requestPasswordReset = useCallback(
    async (email: string) => {
      try {
        setIsLoading(true);
        await authService.requestPasswordReset(email);
        addNotification('Password reset link sent to your email!', 'success');
        navigate('/login');
      } catch (error: any) {
        addNotification(error.response?.data?.message || 'Failed to request password reset', 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, addNotification]
  );

  const resetPassword = useCallback(
    async (resetToken: string, newPassword: string) => {
      try {
        setIsLoading(true);
        await authService.resetPassword(resetToken, newPassword);
        addNotification('Password reset successfully! Please login.', 'success');
        navigate('/login');
      } catch (error: any) {
        addNotification(error.response?.data?.message || 'Failed to reset password', 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, addNotification]
  );

  const loginWithPasskey = useCallback(async () => {
    try {
      setIsLoading(true);
      throw new Error('Passkey login is not yet available. Use email or Google.');
    } catch (error: any) {
      addNotification(error.message || 'Passkey login failed', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const registerPasskey = useCallback(
    async (_deviceName?: string) => {
      try {
        setIsLoading(true);
        if (!token) throw new Error('User not authenticated');
        throw new Error('Passkey registration not yet implemented');
      } catch (error: any) {
        addNotification(error.message || 'Passkey registration failed', 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [token, addNotification]
  );

  const logout = useCallback(() => {
    try {
      authService.logout();
      setToken(null);
      setUser(null);
      localStorage.removeItem('agregas_token');
      localStorage.removeItem('agregas_user');
      addNotification('Logged out successfully', 'success');
      navigate('/');
    } catch (error) {
      addNotification('Error logging out', 'error');
    }
  }, [navigate, addNotification]);

  const refreshAccessToken = useCallback(async () => {
    try {
      if (!token) return;
      const response = await authService.refreshToken();
      setToken(response.token);
      localStorage.setItem('agregas_token', response.token);
    } catch (error) {
      logout();
    }
  }, [token, logout]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    signup,
    verifyOTP,
    resendOTP,
    requestPasswordReset,
    resetPassword,
    loginWithGoogle,
    signupWithGoogle,
    loginWithPasskey,
    registerPasskey,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

async function initiateGoogleOAuth(): Promise<never> {
  throw new Error('Google OAuth not yet configured — install @react-oauth/google');
}