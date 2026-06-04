import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { useNotifications } from '../hooks/useNotifications';
import { Plus } from 'lucide-react';

import { OrdersList } from '../components/OrdersList';
import { EmptyState } from '../components/EmptyState';
import { CreateOrderModal } from '../components/CreateOrder';

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
  latitude?: string;
  longitude?: string;
}

export const Orders = () => {
  const { user } = useAuth();
  const { request, loading } = useApi();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  // State: Orders
  const [orders, setOrders] = useState<Order[]>([]);

  // State: Create Order View Controller
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // State: Form Data
  const [formData, setFormData] = useState({
    purchaseType: 'refill' as 'refill' | 'outright',
    brand: '',
    cylinderSize: '',
    quantity: 1,
    latitude: '',
    longitude: '',
    deliveryAddress: '',
    paymentMethod: 'mpesa',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Fetch customer orders on mount
   */
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await request('get', '/orders/customer');
      // Fix: response is already the body context returned by useApi hook
      if (response?.data) {
        setOrders(response.data);
        console.log('✓ Orders loaded:', response.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      addNotification('Failed to load orders', 'error');
    }
  };

  /**
   * Validate form before submission
   */
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
    if (!formData.latitude.trim()) {
      newErrors.latitude = 'Latitude is required';
    }
    if (!formData.longitude.trim()) {
      newErrors.longitude = 'Longitude is required';
    }
    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Create new order - Then navigate to payment with order data
   */
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (creating) return;
    if (!validateForm()) return;

    setCreating(true);
    try {
      console.log('📤 Creating order with data:', formData);
      
      // ✅ response here holds the JSON sent by your controller: { success: true, data: order, ... }
      const response = await request('post', '/orders/create', formData);
      console.log('✅ Extracted JSON payload:', response);

      const createdOrder = response?.data;

      if (createdOrder) {
        console.log('🎯 Found Order Object:', createdOrder);

        // Add to orders list array
        setOrders([createdOrder, ...orders]);

        // Clear out form inputs right away
        setFormData({
          purchaseType: 'refill',
          brand: '',
          cylinderSize: '',
          quantity: 1,
          latitude: '',
          longitude: '',
          deliveryAddress: '',
          paymentMethod: 'mpesa',
        });
        setErrors({});

        addNotification('Order created! Proceed to payment...', 'success');

        // Drop the standalone conditional form view state layout wrapper
        setShowCreateForm(false);

        // Run navigation securely on next layout rendering pass
        setTimeout(() => {
          navigate('/payment', {
            state: { order: createdOrder },
            replace: true
          });
        }, 20);
      } else {
        console.error('❌ Could not parse order object from data property wrapper.', response);
        addNotification('Failed to parse order return formatting.', 'error');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create order';
      addNotification(errorMsg, 'error');
    } finally {
      setCreating(false);
    }
  };

  /**
   * Cancel an order
   */
  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      // ✅ FIX: Cleaned up the copy-paste order creation duplicate code blocks!
      console.log(`📤 Sending cancellation request for order ID: ${orderId}`);
      await request('delete', `/orders/${orderId}`);
      
      setOrders(orders.filter((o) => o.id !== orderId));
      addNotification('Order cancelled successfully', 'success');
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      const errorMsg = error.response?.data?.message || 'Failed to cancel order';
      addNotification(errorMsg, 'error');
    }
  };

  // Standalone Layout Component configuration
  if (showCreateForm) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4 sm:p-8 py-12">
          <CreateOrderModal 
            isOpen={true} 
            onClose={() => {
              setErrors({});
              setShowCreateForm(false);
            }}
            onSubmit={handleCreateOrder}
            isLoading={creating}
            formData={formData}
            onFormChange={setFormData}
            errors={errors}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="container-custom px-4">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Your Orders</h1>
              <p className="text-gray-600 text-sm sm:text-base mt-2">
                Track and manage all your gas orders
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap"
            >
              <Plus size={20} />
              Place New Order
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : orders.length === 0 ? (
            <EmptyState onPlaceOrder={() => setShowCreateForm(true)} />
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                </h2>
              </div>
              <OrdersList orders={orders} onCancelOrder={handleCancelOrder} />
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};