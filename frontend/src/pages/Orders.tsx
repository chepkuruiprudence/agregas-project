import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { useNotifications } from '../hooks/useNotifications';
import { Plus, MapPin, Truck, Clock, X } from 'lucide-react';

interface Order {
  id: number;
  brand: string;
  cylinderSize: string;
  quantity: number;
  finalPrice: string;
  status: string;
  deliveryAddress: string;
  paymentMethod: string;
  createdAt: string;
  deliveryTime?: string;
}

export const Orders = () => {
  const { user } = useAuth();
  const { request, loading } = useApi();
  const { addNotification } = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    brand: 'SafeGas',
    cylinderSize: '13kg',
    quantity: 1,
    deliveryAddress: '',
    paymentMethod: 'mpesa',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await request('get', '/orders');
      setOrders(response.data || []);
    } catch (error) {
      addNotification('Failed to load orders', 'error');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }
    if (!formData.cylinderSize.trim()) {
      newErrors.cylinderSize = 'Cylinder size is required';
    }
    if (formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }
    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setCreating(true);
    try {
      const response = await request('post', '/orders', formData);
      setOrders([response.data, ...orders]);
      addNotification('Order placed successfully!', 'success');
      setShowCreateForm(false);
      setFormData({
        brand: 'SafeGas',
        cylinderSize: '13kg',
        quantity: 1,
        deliveryAddress: '',
        paymentMethod: 'mpesa',
      });
    } catch (error: any) {
      addNotification(
        error.response?.data?.message || 'Failed to create order',
        'error'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      await request('delete', `/orders/${orderId}`);
      setOrders(orders.filter((o) => o.id !== orderId));
      addNotification('Order cancelled', 'success');
    } catch (error: any) {
      addNotification(
        error.response?.data?.message || 'Failed to cancel order',
        'error'
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-primary-900">Your Orders</h1>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition"
            >
              <Plus size={20} />
              Place New Order
            </button>
          </div>

          {/* Create Order Form Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-primary-900">Place Order</h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleCreateOrder} className="space-y-4">
                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Brand
                    </label>
                    <select
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.brand ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="SafeGas">SafeGas</option>
                      <option value="ProGas">ProGas</option>
                      <option value="EcoGas">EcoGas</option>
                    </select>
                    {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
                  </div>

                  {/* Cylinder Size */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cylinder Size
                    </label>
                    <select
                      value={formData.cylinderSize}
                      onChange={(e) => setFormData({ ...formData, cylinderSize: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.cylinderSize ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="6kg">6kg</option>
                      <option value="13kg">13kg</option>
                      <option value="50kg">50kg (Commercial)</option>
                    </select>
                    {errors.cylinderSize && (
                      <p className="text-red-500 text-sm mt-1">{errors.cylinderSize}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.quantity ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="1"
                    />
                    {errors.quantity && (
                      <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
                    )}
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Delivery Address
                    </label>
                    <textarea
                      value={formData.deliveryAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, deliveryAddress: e.target.value })
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.deliveryAddress ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your delivery address"
                      rows={3}
                    />
                    {errors.deliveryAddress && (
                      <p className="text-red-500 text-sm mt-1">{errors.deliveryAddress}</p>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentMethod: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="mpesa">M-Pesa</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="cash">Cash on Delivery</option>
                    </select>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {creating ? 'Placing Order...' : 'Place Order'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Orders List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow text-center">
              <Truck size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-6">No orders yet</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition"
              >
                Place Your First Order
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left: Order Info */}
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Order #{order.id}</p>
                          <h3 className="text-xl font-bold text-primary-900">
                            {order.brand} - {order.cylinderSize} x {order.quantity}
                          </h3>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status?.charAt(0).toUpperCase() +
                            order.status?.slice(1).toLowerCase()}
                        </span>
                      </div>

                      <div className="space-y-2 text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span>{order.deliveryAddress}</span>
                        </div>
                        {order.deliveryTime && (
                          <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>Est. Delivery: {order.deliveryTime}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Price & Actions */}
                    <div className="flex flex-col justify-between">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Price</p>
                        <p className="text-3xl font-bold text-primary-500">
                          {order.finalPrice} KES
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Payment: {order.paymentMethod.toUpperCase()}
                        </p>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-semibold">
                          Track Order
                        </button>
                        {['pending', 'confirmed'].includes(order.status?.toLowerCase()) && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-semibold"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Order Timeline</p>
                    <div className="flex justify-between text-center text-xs">
                      <div
                        className={`flex-1 pb-2 ${
                          ['pending', 'confirmed', 'in_transit', 'delivered'].includes(
                            order.status?.toLowerCase()
                          )
                            ? 'text-primary-600'
                            : 'text-gray-400'
                        }`}
                      >
                        <div className="font-bold">Ordered</div>
                        <div className="text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div
                        className={`flex-1 pb-2 ${
                          ['confirmed', 'in_transit', 'delivered'].includes(
                            order.status?.toLowerCase()
                          )
                            ? 'text-primary-600'
                            : 'text-gray-400'
                        }`}
                      >
                        <div className="font-bold">Confirmed</div>
                        <div className="text-gray-500">Within 1h</div>
                      </div>
                      <div
                        className={`flex-1 pb-2 ${
                          ['in_transit', 'delivered'].includes(order.status?.toLowerCase())
                            ? 'text-primary-600'
                            : 'text-gray-400'
                        }`}
                      >
                        <div className="font-bold">In Transit</div>
                        <div className="text-gray-500">2-4h</div>
                      </div>
                      <div
                        className={`flex-1 pb-2 ${
                          order.status?.toLowerCase() === 'delivered'
                            ? 'text-primary-600'
                            : 'text-gray-400'
                        }`}
                      >
                        <div className="font-bold">Delivered</div>
                        <div className="text-gray-500">Pending</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};