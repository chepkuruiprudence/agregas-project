export const PRICING_TIERS = {
  basic: {
    name: 'Basic',
    depositAmount: 500,
    monthlyCredit: 500,
    features: ['Daily delivery', 'Basic support', '5% loyalty points'],
    color: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  standard: {
    name: 'Standard',
    depositAmount: 1000,
    monthlyCredit: 1000,
    features: ['Daily delivery', 'Priority support', '10% loyalty points', 'Free first delivery'],
    color: 'bg-blue-100',
    borderColor: 'border-blue-300',
    recommended: true,
  },
  premium: {
    name: 'Premium',
    depositAmount: 2000,
    monthlyCredit: 2000,
    features: ['Same-day delivery', '24/7 support', '15% loyalty points', 'Free first 3 deliveries'],
    color: 'bg-primary-50',
    borderColor: 'border-primary-300',
  },
};

export const FEATURES = [
  {
    icon: '⚡',
    title: 'Fast Delivery',
    description: 'Get your gas delivered within 2-4 hours',
  },
  {
    icon: '🛡️',
    title: 'Safe & Reliable',
    description: 'Verified retailers and secure transactions',
  },
  {
    icon: '💰',
    title: 'Best Prices',
    description: 'Dynamic pricing ensures competitive rates',
  },
  {
    icon: '🌱',
    title: 'Environmental',
    description: 'Earn carbon credits for sustainable choices',
  },
  {
    icon: '⭐',
    title: 'Loyalty Rewards',
    description: 'Earn and redeem points on every purchase',
  },
  {
    icon: '📍',
    title: 'Live Tracking',
    description: 'Track your delivery in real-time',
  },
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Sign Up',
    description: 'Create your account in seconds',
  },
  {
    step: 2,
    title: 'Place Order',
    description: 'Select gas, quantity, and delivery address',
  },
  {
    step: 3,
    title: 'Get Delivered',
    description: 'Track your delivery in real-time',
  },
  {
    step: 4,
    title: 'Earn Rewards',
    description: 'Get loyalty points and carbon credits',
  },
];

export const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';