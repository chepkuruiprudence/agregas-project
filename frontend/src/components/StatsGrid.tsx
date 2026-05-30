import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { ShoppingBag, Star, Leaf, CheckCircle } from 'lucide-react';

interface StatsData {
  totalOrders: number;
  loyaltyPoints: number;
  carbonCredits: number;
  subscriptionTier: string;
}

export const StatsGrid = () => {
  const { request } = useApi();
  const [stats, setStats] = useState<StatsData>({
    totalOrders: 0,
    loyaltyPoints: 0,
    carbonCredits: 0,
    subscriptionTier: 'None',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(false);

      console.log('📊 Fetching dashboard stats...');

      // ✅ FIXED: Call the correct endpoint
      const [ordersRes, loyaltyRes, cgcRes] = await Promise.all([
        request('get', '/orders'),  // ✅ Changed from /orders/customer to /orders
        request('get', '/loyalty/balance'),
        request('get', '/cgc/balance'),
      ]);

      console.log('✓ Orders response:', ordersRes.data);
      console.log('✓ Loyalty response:', loyaltyRes.data);
      console.log('✓ CGC response:', cgcRes.data);

      // Parse orders
      let totalOrders = 0;
      if (ordersRes.data?.data) {
        totalOrders = Array.isArray(ordersRes.data.data) 
          ? ordersRes.data.data.length 
          : 0;
      }

      // Parse loyalty points
      let loyaltyPoints = 0;
      if (loyaltyRes.data?.data) {
        if (typeof loyaltyRes.data.data === 'object' && 'balance' in loyaltyRes.data.data) {
          loyaltyPoints = loyaltyRes.data.data.balance || 0;
        } else if (typeof loyaltyRes.data.data === 'number') {
          loyaltyPoints = loyaltyRes.data.data;
        }
      }

      // Parse CGC credits
      let carbonCredits = 0;
      if (cgcRes.data?.data) {
        if (typeof cgcRes.data.data === 'object' && 'balance' in cgcRes.data.data) {
          carbonCredits = cgcRes.data.data.balance || 0;
        } else if (typeof cgcRes.data.data === 'number') {
          carbonCredits = cgcRes.data.data;
        }
      }

      console.log('✓ Parsed stats:', {
        totalOrders,
        loyaltyPoints,
        carbonCredits,
      });

      setStats({
        totalOrders,
        loyaltyPoints,
        carbonCredits,
        subscriptionTier: 'None',
      });
    } catch (err) {
      console.error('❌ API fetch error:', err);
      setError(true);
      // Set fallback values so dashboard still works
      setStats({
        totalOrders: 0,
        loyaltyPoints: 0,
        carbonCredits: 0,
        subscriptionTier: 'None',
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Active orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingBag,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Subscription',
      value: stats.subscriptionTier,
      icon: CheckCircle,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      label: 'Loyalty points',
      value: stats.loyaltyPoints.toLocaleString(),
      icon: Star,
      bgColor: 'bg-teal-100',
      iconColor: 'text-teal-600',
    },
    {
      label: 'CGC balance',
      value: stats.carbonCredits.toLocaleString(),
      icon: Leaf,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-gray-200 rounded w-20" />
                <div className="h-6 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {statCards.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <Icon size={24} className={stat.iconColor} />
              </div>
              <div>
                <p className="text-gray-600 text-xs font-medium uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};