import apiClient from './api';
import { LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../types';

// Let's create specific payload interfaces or reuse what's needed
export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('🔐 Auth service login with:', credentials);
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    console.log('✓ Login response received:', response.data.data);
    return response.data.data!;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    console.log('📝 Auth service register with:', { ...data, password: '***' });
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data!;
  },

  // ✅ NEW: Added for Email Verification Init (Signup stage)
  async signup(data: any): Promise<any> {
    console.log('📝 Auth service signup init:', { ...data, password: '***' });
    const response = await apiClient.post<ApiResponse<any>>('/auth/signup', data);
    return response.data;
  },

  // ✅ NEW: Verify OTP Code
  async verifyOTP(data: any): Promise<AuthResponse> {
    console.log('🔐 Verifying OTP for:', data.email);
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/verify-otp', data);
    return response.data.data!;
  },

  // ✅ NEW: Resend OTP
  async resendOTP(email: string): Promise<any> {
    console.log('🔄 Requesting OTP resend for:', email);
    const response = await apiClient.post<ApiResponse<any>>('/auth/resend-otp', { email });
    return response.data;
  },

  // ✅ NEW: Google OAuth callback handler
  async googleOAuthCallback(profile: any): Promise<any> {
    console.log('🔐 Processing Google profile integration');
    const response = await apiClient.post<ApiResponse<any>>('/auth/google/callback', profile);
    return response.data.data!;
  },

  // ✅ NEW: Request Password Reset Link
  async requestPasswordReset(email: string): Promise<any> {
    console.log('🔑 Requesting reset link for:', email);
    const response = await apiClient.post<ApiResponse<any>>('/auth/forgot-password', { email });
    return response.data;
  },

  // ✅ NEW: Reset Password Execution
  async resetPassword(token: string, password_hash: string): Promise<any> {
    console.log('🔑 Executing password reset with token');
    const response = await apiClient.post<ApiResponse<any>>('/auth/reset-password', { token, password_hash });
    return response.data;
  },

  async logout(): Promise<void> {
    console.log('🚪 Logging out...');
    localStorage.removeItem('agregas_token');
    localStorage.removeItem('agregas_user');
  },

  async refreshToken(): Promise<{ token: string }> {
    console.log('🔄 Refreshing token...');
    const response = await apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh');
    console.log('✓ Token refreshed');
    return response.data.data!;
  },
};