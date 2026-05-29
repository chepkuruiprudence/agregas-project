// Brand Dashboard Types
export interface BrandStats {
  totalProducts: number;
  activeRetailers: number;
  totalVolumeSold: number;
  totalCgcsIssued: number;
  monthlyRevenue: string;
  marketShare: string;
  averageRating: number;
  totalReviews: number;
}

export interface BrandProduct {
  id: number;
  brandId: number;
  name: string;
  cylinderSize: '6kg' | '13kg' | '50kg';
  basePrice: string;
  category: 'LPG' | 'CNG' | 'Bio';
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandRetailer {
  id: number;
  brandId: number;
  retailerId: number;
  businessName: string;
  latitude: number;
  longitude: number;
  distance: number;
  isVerified: boolean;
  totalOrders: number;
  totalVolume: number;
  rating: number;
  reviews: number;
  lastOrderDate?: Date;
}

export interface BrandPerformance {
  period: 'daily' | 'weekly' | 'monthly';
  totalSales: number;
  volumeSold: number;
  revenue: string;
  topRetailer: string;
  averageOrderValue: string;
  cgcsIssued: number;
}

export interface BrandRequest {
  companyName: string;
  productCategory: string;
  taxId: string;
}

export interface BrandAnalytics {
  chartData: {
    date: string;
    sales: number;
    volume: number;
    revenue: number;
  }[];
  topProducts: {
    name: string;
    sales: number;
    volume: number;
  }[];
  topRetailers: {
    name: string;
    volume: number;
    orders: number;
    rating: number;
  }[];
  regionPerformance: {
    region: string;
    retailers: number;
    volume: number;
    revenue: string;
  }[];
}

export interface PricingUpdate {
  productId: number;
  newBasePrice: string;
  effectiveDate: Date;
  reason: string;
}

export interface RetailerPerformanceMetrics {
  retailerId: number;
  businessName: string;
  totalOrders: number;
  totalVolume: number;
  totalRevenue: string;
  averageOrderValue: string;
  lastOrderDate: Date;
  rating: number;
  reviews: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}