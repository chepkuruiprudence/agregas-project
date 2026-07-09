// frontend/src/hooks/useAuth.ts

import { useContext } from 'react';
import { AuthContext, AuthContextType, LoginRequest, SignupRequest } from '../context/AuthContext';

/**
 * Custom hook to use authentication context
 * Provides all auth methods: login, signup, Google OAuth, password reset, passkeys, etc.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

// Export types for use in components
export type { AuthContextType, LoginRequest, SignupRequest };