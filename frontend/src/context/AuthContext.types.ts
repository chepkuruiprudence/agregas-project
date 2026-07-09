// frontend/src/context/AuthContext.types.ts
// Separated from AuthContext.tsx so Vite Fast Refresh works correctly.
// AuthContext.tsx exports only components; types/interfaces live here.

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: 'customer' | 'retailer' | 'brand' | 'admin';
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: 'customer' | 'retailer' | 'brand';
  businessName?: string;
  businessLicense?: string;
  latitude?: number;
  longitude?: number;
  companyName?: string;
  productCategory?: string;
  taxId?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: SignupRequest) => Promise<void>;
  logout: () => void;

  signup: (email: string, password: string, fullName: string, phone: string, role: string) => Promise<void>;
  verifyOTP: (email: string, otpCode: string, password: string, fullName: string, phone: string, role: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;

  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;

  loginWithGoogle: (googleProfile?: any) => Promise<void>;
  signupWithGoogle: (googleProfile?: any) => Promise<void>;

  loginWithPasskey: () => Promise<void>;
  registerPasskey: (deviceName?: string) => Promise<void>;

  refreshAccessToken: () => Promise<void>;
}