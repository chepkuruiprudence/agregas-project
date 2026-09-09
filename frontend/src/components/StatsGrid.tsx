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

  // @ts-ignore
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(false);

      console.log('📊 Fetching dashboard stats...');

      // request() returns the response body directly:
      // { success, statusCode, data, message }
      const [ordersRes, loyaltyRes, cgcRes, subsRes] = await Promise.all([
        request('get', '/orders/customer'),
        request('get', '/loyalty/balance/me'),
        request('get', '/cgc/balance/me'),
        request('get', '/subscriptions/mine'),
      ]);

      console.log('✓ Orders response:', ordersRes);
      console.log('✓ Loyalty response:', loyaltyRes);
      console.log('✓ CGC response:', cgcRes);

      // Parse orders (body.data is the orders array)
      let totalOrders = 0;
      if (Array.isArray(ordersRes?.data)) {
        totalOrders = ordersRes.data.length;
      }

      // Parse loyalty points (body.data = { customerId, balance })
      let loyaltyPoints = 0;
      if (typeof loyaltyRes?.data?.balance === 'number') {
        loyaltyPoints = loyaltyRes.data.balance;
      }

      // Parse CGC credits (body.data = { customerId, balance })
      let carbonCredits = 0;
      if (typeof cgcRes?.data?.balance === 'number') {
        carbonCredits = cgcRes.data.balance;
      }

      // Parse subscription tier (body.data = subscription[] newest first)
      let subscriptionTier = 'None';
      const subs = Array.isArray(subsRes?.data) ? subsRes.data : [];
      const activeSub = subs.find((s: any) => s.status === 'active');
      if (activeSub) {
        subscriptionTier =
          activeSub.tier.charAt(0).toUpperCase() + activeSub.tier.slice(1);
      }

      console.log('✓ Parsed stats:', {
        totalOrders,
        loyaltyPoints,
        carbonCredits,
        subscriptionTier,
      });

      setStats({
        totalOrders,
        loyaltyPoints,
        carbonCredits,
        subscriptionTier,
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