export interface CreateSubscriptionRequest {
  tier: "basic" | "standard" | "premium";
  depositAmount: number;
}

export interface SubscriptionResponse {
  id: number;
  customerId: number;
  tier: string;
  depositAmount: string;
  currentBalance: string;
  rolloverPercentage: number;
  expiryDate: Date;
  status: string;
  createdAt: Date;
}

export interface RenewSubscriptionRequest {
  subscriptionId: number;
}

export interface SubscriptionTierConfig {
  basic: { depositAmount: number; monthlyCredit: number };
  standard: { depositAmount: number; monthlyCredit: number };
  premium: { depositAmount: number; monthlyCredit: number };
}