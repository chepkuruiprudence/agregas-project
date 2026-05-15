export interface User {
  id: number;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string | null;
  role: "customer" | "retailer" | "brand_marketer" | "admin";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Retailer {
  id: number;
  userId: number;
  businessName: string;
  latitude: string;
  longitude: string;
  address: string;
  phone: string;
  brand: string;
  stockQuantity: number;
  cylinderSize: string;
  tier: "autogas" | "retail" | "institutional";
  rating: string;
  totalReviews: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  brand: string;
  cylinderSize: string;
  basePrice: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Order {
  id: number;
  customerId: number;
  retailerId: number;
  productId: number;
  status: "pending" | "confirmed" | "processing" | "in_delivery" | "delivered" | "cancelled";
  quantity: number;
  brand: string;
  unitPrice: string;
  totalPrice: string;
  rebateAmount: string;
  finalPrice: string;
  deliveryTime: string | null;
  deliveryAddress: string | null;
  paymentMethod: string | null;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: number;
  customerId: number;
  tier: "basic" | "standard" | "premium";
  depositAmount: string;
  currentBalance: string;
  rolloverPercentage: number;
  rolloverAmount: string;
  expiryDate: Date;
  status: "active" | "paused" | "cancelled" | "expired";
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyPoints {
  id: number;
  customerId: number;
  points: number;
  earnedAt: Date | null;
  earnedFromOrderId: number | null;
  redeemedAt: Date | null;
  redeemedForOrderId: number | null;
  redemptionValue: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CgcToken {
  id: number;
  customerId: number;
  amount: string;
  earnedAt: Date | null;
  earnedFromOrderId: number | null;
  redeemedAt: Date | null;
  redeemedForOrderId: number | null;
  redemptionAmount: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GasCredit {
  id: number;
  customerId: number;
  amount: string;
  interestRate: string;
  status: string;
  repaymentBalance: string;
  repaymentSchedule: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  relatedOrderId: number | null;
  isRead: boolean;
  createdAt: Date;
}

export interface DeliveryTracking {
  id: number;
  orderId: number;
  status: "pending" | "in_transit" | "delivered" | "failed";
  latitude: string | null;
  longitude: string | null;
  currentAddress: string | null;
  estimatedArrivalTime: Date | null;
  actualDeliveryTime: Date | null;
  updatedAt: Date;
}

export interface PricingSnapshot {
  id: number;
  brand: string;
  cylinderSize: string;
  supplyKg: number;
  demandKg: number;
  supplyDemandRatio: string;
  pricePerKg: string;
  basePricePerKg: string;
  rebatePercentage: string;
  timestamp: Date;
}

export interface AnalyticsEvent {
  id: number;
  eventType: string;
  userId: number | null;
  metadata: any;
  createdAt: Date;
}