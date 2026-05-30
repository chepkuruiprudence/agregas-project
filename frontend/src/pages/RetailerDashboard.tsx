import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useNotifications } from '../hooks/useNotifications';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Star,
  Save,
  Phone,
  Clock,
  MapPin,
  Check,
  AlertCircle,
  Plus
} from 'lucide-react';

interface RetailerStats {
  activeOrders: number;
  stockLevel: number;
  todaySales: number;
  rating: number;
}

interface Order {
  id: number;
  customerId: number;
  quantity: number;
  status: string;
  finalPrice: string;
  createdAt: string;
}

interface InventoryItem {
  id: number;
  brand: string;
  cylinderSize: string;
  quantity: number;
  threshold: number;
}

export const RetailerDashboard = () => {
  const { user } = useAuth();
  const { request } = useApi();
  const { addNotification } = useNotifications();

  // State
  const [stats, setStats] = useState<RetailerStats>({
    activeOrders: 0,
    stockLevel: 0,
    todaySales: 0,
    rating: 5.0,
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [mPesaPhone, setMPesaPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingMPesa, setSavingMPesa] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRetailerStats(),
        fetchRetailerOrders(),
        fetchInventory(),
        fetchMPesaSettings(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRetailerStats = async () => {
    try {
      const response = await request('get', '/retailer/stats');
      if (response.data?.data) {
        setStats(response.data.data);
        console.log('✓ Retailer stats loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      addNotification('Failed to load statistics', 'error');
    }
  };

  const fetchRetailerOrders = async () => {
    try {
      const response = await request('get', '/retailer/orders');
      if (response.data?.data && Array.isArray(response.data.data)) {
        setOrders(response.data.data.slice(0, 5)); // Last 5 orders
        console.log('✓ Orders loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await request('get', '/retailer/inventory');
      if (response.data?.data && Array.isArray(response.data.data)) {
        setInventory(response.data.data);
        console.log('✓ Inventory loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchMPesaSettings = async () => {
    try {
      const response = await request('get', '/retailer/mpesa-settings');
      if (response.data?.data?.phone) {
        setMPesaPhone(response.data.data.phone);
        console.log('✓ M-Pesa settings loaded');
      }
    } catch (error) {
      console.error('Error fetching M-Pesa settings:', error);
    }
  };

  const handleSaveMPesa = async () => {
    if (!mPesaPhone.trim()) {
      addNotification('Please enter a phone number', 'error');
      return;
    }

    if (!/^07\d{8}$/.test(mPesaPhone)) {
      addNotification('Phone number must be in format 07XXXXXXXX', 'error');
      return;
    }

    try {
      setSavingMPesa(true);
      await request('put', '/retailer/mpesa-settings', {
        phone: mPesaPhone,
      });
      addNotification('M-Pesa settings saved successfully', 'success');
      console.log('✓ M-Pesa settings saved');
    } catch (error) {
      console.error('Error saving M-Pesa settings:', error);
      addNotification('Failed to save M-Pesa settings', 'error');
    } finally {
      setSavingMPesa(false);
    }
  };

  // Stat Card Component
  const StatCard = ({ icon: Icon, label, value, isLoading }: any) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full">
          <Icon size={28} className="text-white" />
        </div>
      </div>
      <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
      {isLoading ? (
        <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
      ) : (
        <p className="text-4xl font-bold text-gray-900">{value}</p>
      )}
    </div>
  );

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

  const isLowStock = (item: InventoryItem) => item.quantity <= item.threshold;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header */}
        <div className="border-b border-gray-100 bg-white py-8">
          <div className="container-custom px-4">
            <h1 className="text-4xl font-bold text-gray-900">Retailer Dashboard</h1>
            <p className="text-gray-600 text-lg mt-2">
              Manage orders, inventory, and view your performance
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container-custom py-12 px-4">
          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <StatCard
              icon={ShoppingBag}
              label="Active orders"
              value={stats.activeOrders}
              isLoading={loading}
            />
            <StatCard
              icon={Package}
              label="Stock (kg)"
              value={stats.stockLevel}
              isLoading={loading}
            />
            <StatCard
              icon={TrendingUp}
              label="Today's sales"
              value={`KSh ${stats.todaySales}`}
              isLoading={loading}
            />
            <StatCard
              icon={Star}
              label="Rating"
              value={stats.rating.toFixed(1)}
              isLoading={loading}
            />
          </div>

          {/* M-Pesa Settings Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              M-Pesa payout settings
            </h2>
            <p className="text-gray-600 mb-6">
              M-Pesa phone (B2C payouts received here)
            </p>

            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <input
                  type="tel"
                  value={mPesaPhone}
                  onChange={(e) => setMPesaPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  maxLength={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Format: 07XXXXXXXX (Safaricom, Airtel, or Vodafone)
                </p>
              </div>
              <button
                onClick={handleSaveMPesa}
                disabled={savingMPesa}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-semibold transition whitespace-nowrap"
              >
                <Save size={20} />
                {savingMPesa ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Queue */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-100 p-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBag size={28} />
                  Order queue
                </h2>
                <p className="text-gray-600 text-sm mt-1">Pending and active orders</p>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-12 text-center">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600">No orders yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <div key={order.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            Order #{order.id}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                            <Clock size={16} />
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {order.quantity}kg • {order.finalPrice} KES
                        </span>
                        <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                          View →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-100 p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Package size={28} />
                    Inventory
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">Current stock levels</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition">
                  <Plus size={20} />
                  Add
                </button>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : inventory.length === 0 ? (
                <div className="p-12 text-center">
                  <Package size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600">No inventory items</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {inventory.map((item) => (
                    <div key={item.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {item.brand} {item.cylinderSize}
                          </h3>
                          {isLowStock(item) && (
                            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle size={16} />
                              Low stock
                            </p>
                          )}
                        </div>
                        {isLowStock(item) ? (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            Alert
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1">
                            <Check size={14} />
                            OK
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {item.quantity}kg available
                        </span>
                        <span className="text-sm text-gray-500">
                          Threshold: {item.threshold}kg
                        </span>
                      </div>
                      {isLowStock(item) && (
                        <button className="mt-3 w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-lg transition">
                          Reorder now
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};