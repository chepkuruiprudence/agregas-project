export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    phone: string;
    role: string;
  };
}

// ✅ UPDATED: Now includes role and optional role-specific fields
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: 'customer' | 'retailer' | 'brand_marketer'; // ✅ REQUIRED
  // Retailer fields
  businessName?: string;
  businessLicense?: string;
  latitude?: number;
  longitude?: number;
  // Brand Marketer fields
  companyName?: string;
  productCategory?: string;
  taxId?: string;
}

export interface RegisterResponse {
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    phone: string;
    role: string;
  };
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    phone: string;
    role: string;
  };
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface TokenRequest {
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
}