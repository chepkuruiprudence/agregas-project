import apiClient from './api';
import { LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      credentials
    );
    return response.data.data!;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      data
    );
    return response.data.data!;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('agregas_token');
    localStorage.removeItem('agregas_user');
  },

  async refreshToken(): Promise<string> {
    const response = await apiClient.post<ApiResponse<{ token: string }>>(
      '/auth/refresh'
    );
    return response.data.data?.token || '';
  },
};