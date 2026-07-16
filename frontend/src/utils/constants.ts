export const PRICING_TIERS = {
  basic: {
    name: 'Basic',
    depositAmount: 500,
    monthlyCredit: 500,
    features: ['Daily delivery', 'Basic support', '5% loyalty points'],
    color: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: 'TrendingDown',  // ← String instead of component
  },
  standard: {
    name: 'Standard',
    depositAmount: 1000,
    monthlyCredit: 1000,
    features: ['Daily delivery', 'Priority support', '10% loyalty points', 'Free first delivery'],
    color: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: 'Star',  // ← String
    recommended: true,
  },
  premium: {
    name: 'Premium',
    depositAmount: 2000,
    monthlyCredit: 2000,
    features: ['Same-day delivery', '24/7 support', '15% loyalty points', 'Free first 3 deliveries'],
    color: 'bg-primary-50',
    borderColor: 'border-primary-300',
    icon: 'Zap',  // ← String
  },
};

export const FEATURES = [
  {
    icon: 'Zap',  // ← String
    title: 'Fast Delivery',
    description: 'Get your gas delivered within 2-4 hours',
  },
  {
    icon: 'Shield',  // ← String
    title: 'Safe & Reliable',
    description: 'Verified retailers and secure transactions',
  },
  {
    icon: 'TrendingDown',  // ← String
    title: 'Best Prices',
    description: 'Dynamic pricing ensures competitive rates',
  },
  {
    icon: 'Leaf',  // ← String
    title: 'Environmental',
    description: 'Earn carbon credits for sustainable choices',
  },
  {
    icon: 'Star',  // ← String
    title: 'Loyalty Rewards',
    description: 'Earn and redeem points on every purchase',
  },
  {
    icon: 'MapPin',  // ← String
    title: 'Live Tracking',
    description: 'Track your delivery in real-time',
  },
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    icon: 'Users',  // ← String
    title: 'Sign Up',
    description: 'Create your account in seconds',
  },
  {
    step: 2,
    icon: 'ShoppingCart',  // ← String
    title: 'Place Order',
    description: 'Select gas, quantity, and delivery address',
  },
  {
    step: 3,
    icon: 'Truck',  // ← String
    title: 'Get Delivered',
    description: 'Track your delivery in real-time',
  },
  {
    step: 4,
    icon: 'Gift',  // ← String
    title: 'Earn Rewards',
    description: 'Get loyalty points and carbon credits',
  },
];

export const API_BASE_URL = 'http://localhost:3000/api';