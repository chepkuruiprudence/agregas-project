// User Types
export interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: 'customer' | 'retailer' | 'brand_marketer' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
}

// Order Types
export interface Order {
  id: number;
  customerId: number;
  retailerId: number;
  status: string;
  quantity: number;
  brand: string;
  finalPrice: string;
  deliveryTime?: string;
  deliveryAddress: string;
  createdAt: string;
}

// Subscription Types
export interface Subscription {
  id: number;
  customerId: number;
  tier: 'basic' | 'standard' | 'premium';
  depositAmount: string;
  currentBalance: string;
  expiryDate: string;
  status: string;
}

// Notification Types
export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}