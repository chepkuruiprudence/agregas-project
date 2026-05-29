import apiClient from './api';
import { LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('🔐 Auth service login with:', credentials);

    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      credentials
    );

    console.log('✓ Login response received:', response.data.data);
    return response.data.data!;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    console.log('📝 Auth service register with:', {
      ...data,
      password: '***', // Don't log password
    });

    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      data
    );

    console.log('✓ Register response received:', {
      token: response.data.data?.token?.substring(0, 20) + '...',
      user: response.data.data?.user,
    });

    return response.data.data!;
  },

  async logout(): Promise<void> {
    console.log('🚪 Logging out...');
    localStorage.removeItem('agregas_token');
    localStorage.removeItem('agregas_user');
  },

  async refreshToken(): Promise<string> {
    console.log('🔄 Refreshing token...');

    const response = await apiClient.post<ApiResponse<{ token: string }>>(
      '/auth/refresh'
    );

    console.log('✓ Token refreshed');
    return response.data.data?.token || '';
  },
};