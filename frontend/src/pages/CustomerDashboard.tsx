import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { useNotifications } from '../hooks/useNotifications';
import { StatsGrid } from '../components/StatsGrid';
import { 
  ShoppingCart, 
  Plus, 
  Gift, 
  Zap, 
  Bell, 
  MapPin,
  Clock,
  TrendingUp,
  ChevronRight
} from 'lucide-react';

interface RecentOrder {
  id: number;
  brand: string;
  quantity: number;
  status: string;
  finalPrice: string;
  createdAt: string;
}

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { request } = useApi();
  const { addNotification } = useNotifications();

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await request('get', '/orders/customer');
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        // Get first 3 orders
        const orders = response.data.data.slice(0, 3).map((order: any) => ({
          id: order.id,
          brand: order.brand,
          quantity: order.quantity,
          status: order.status,
          finalPrice: order.final_price,
          createdAt: order.created_at,
        }));
        setRecentOrders(orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      in_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header Section */}
        <div className="border-b border-gray-100 bg-white sticky top-16 z-10">
          <div className="container-custom py-6 px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                  Welcome to AGREGAS
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Order gas, manage your subscription, and earn rewards.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container-custom py-12 px-4">
          {/* Navigation Tabs */}
          <div className="flex gap-3 mb-12 overflow-x-auto pb-2">
            <button 
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full font-semibold hover:shadow-lg transition whitespace-nowrap"
            >
              <ShoppingCart size={20} />
              Marketplace
            </button>
            <button 
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:border-gray-300 transition whitespace-nowrap"
            >
              <Plus size={20} />
              New order
            </button>
            <button 
              onClick={() => navigate('/subscription')}
              className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:border-gray-300 transition whitespace-nowrap"
            >
              Subscriptions
            </button>
            <button 
              onClick={() => navigate('/rewards')}
              className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:border-gray-300 transition whitespace-nowrap"
            >
              Rewards
            </button>
            <button 
              onClick={() => navigate('/gas-credit')}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:border-gray-300 transition whitespace-nowrap"
            >
              <Zap size={20} />
              Gas-on-Credit
            </button>
            <button 
              onClick={() => navigate('/notifications')}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:border-gray-300 transition whitespace-nowrap"
            >
              <Bell size={20} />
              Notifications
            </button>
          </div>

          {/* Stats Grid */}
          <StatsGrid />

          {/* Main Grid Layout */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Left Column - Recent Orders */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 p-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Recent orders</h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Your latest gas orders and deliveries
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/orders')}
                    className="text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1"
                  >
                    View all
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Orders List */}
                {ordersLoading ? (
                  <div className="p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="p-12 text-center">
                    <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 mb-4">No orders yet</p>
                    <button
                      onClick={() => navigate('/orders')}
                      className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
                    >
                      Place Your First Order
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="p-6 hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                              {order.brand} {order.quantity}kg
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                              <Clock size={16} />
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 text-lg">
                              {order.finalPrice} KES
                            </p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Quick Actions & Tips */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quick actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/orders')}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-50 hover:from-blue-100 hover:to-blue-100 rounded-lg transition text-left"
                  >
                    <span className="font-semibold text-gray-900">Place an order</span>
                    <Plus size={20} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => navigate('/subscription')}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-50 hover:from-orange-100 hover:to-orange-100 rounded-lg transition text-left"
                  >
                    <span className="font-semibold text-gray-900">Manage subscription</span>
                    <TrendingUp size={20} className="text-orange-600" />
                  </button>
                  <button
                    onClick={() => navigate('/rewards')}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-50 hover:from-amber-100 hover:to-amber-100 rounded-lg transition text-left"
                  >
                    <span className="font-semibold text-gray-900">Redeem rewards</span>
                    <Gift size={20} className="text-amber-600" />
                  </button>
                </div>
              </div>

              {/* Pro Tips */}
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl border border-primary-200 p-6">
                <h3 className="text-lg font-bold text-primary-900 mb-3">💡 Pro Tips</h3>
                <ul className="space-y-2 text-sm text-primary-900">
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Subscribe for 20% discount on recurring orders</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Earn 1 loyalty point per kg purchased</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>CGCs are worth 1 KES each in discounts</span>
                  </li>
                </ul>
              </div>

              {/* Delivery Info */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  Delivery Info
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Fast, reliable delivery from our nearest retailers to your location.
                </p>
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold transition"
                >
                  Track deliveries
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};