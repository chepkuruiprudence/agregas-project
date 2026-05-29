import { useEffect, useState } from 'react';
import axios from 'axios';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StarIcon from '@mui/icons-material/Star';
import SpokeIcon from '@mui/icons-material/Spoke'; 
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

interface StatsData {
  totalOrders: number;
  loyaltyPoints: number;
  carbonCredits: number;
  subscriptionTier: string;
}

export const StatsGrid = () => {
  const [stats, setStats] = useState<StatsData>({
    totalOrders: 0,
    loyaltyPoints: 0,
    carbonCredits: 0,
    subscriptionTier: 'None',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError(false);

        // 1. Pointed directly to your active port 3000 server
        const API_BASE = 'http://localhost:3000/api'; 
        
        // 2. Retrieve token for authorization headers
        const token = localStorage.getItem('agregas_token');
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        // 3. Request your endpoints concurrently 
        const [ordersRes, loyaltyRes, cgcRes] = await Promise.all([
          axios.get(`${API_BASE}/orders/customer`, config),
          axios.get(`${API_BASE}/loyalty/balance`, config),
          axios.get(`${API_BASE}/cgc/balance`, config),
        ]);

        // 4. Safely parse data payloads matching your Express routes
        const totalOrders = Array.isArray(ordersRes.data?.data) ? ordersRes.data.data.length : 0;
        const loyaltyPoints = loyaltyRes.data?.data?.balance || loyaltyRes.data?.data || 0;
        const carbonCredits = cgcRes.data?.data?.balance || cgcRes.data?.data || 0;
        const subscriptionTier = 'Premium'; 

        setStats({
          totalOrders,
          loyaltyPoints,
          carbonCredits,
          subscriptionTier,
        });
      } catch (err) {
        console.error('API fetch error on dashboard cards:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const statCards = [
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: <ShoppingBagIcon sx={{ fontSize: 36 }} className="text-blue-500" />,
    },
    {
      label: 'Loyalty Points',
      value: stats.loyaltyPoints.toLocaleString(),
      icon: <StarIcon sx={{ fontSize: 36 }} className="text-yellow-500" />,
    },
    {
      label: 'Carbon Credits',
      value: stats.carbonCredits.toLocaleString(),
      icon: <SpokeIcon sx={{ fontSize: 36 }} className="text-green-500" />,
    },
    {
      label: 'Active Subscription',
      value: stats.subscriptionTier,
      icon: <VerifiedUserIcon sx={{ fontSize: 36 }} className="text-teal-500" />,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg shadow animate-pulse flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-6 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-12 text-sm text-center font-medium">
        Error calculating real-time metrics. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {statCards.map((stat, idx) => (
        <div
          key={idx}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition flex items-center gap-4"
        >
          <div className="flex items-center justify-center bg-gray-50 p-3 rounded-xl">
            {stat.icon}
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};