import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
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
  purchaseType: 'refill' | 'outright';
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
  const { request, loading } = useApi();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  // State: Orders List
  const [orders, setOrders] = useState<Order[]>([]);

  // State: Create Order View Controller
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  /**
   * Fetch customer orders on mount
   */
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await request('get', '/orders/customer');
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
   * Create new order handler
   */
  const handleCreateOrder = async (orderData: any) => {
    try {
      setCreating(true);
      console.log('📡 Sending order payload:', orderData);

      const response = await request('post', '/orders/create', orderData);
      console.log('✓ Order created successfully:', response);

      addNotification('Order created successfully!', 'success');

      // Redirect to payment page with the created order
      const createdOrder = response?.data?.order || response?.data;
      if (createdOrder) {
        navigate('/payment', {
          state: {
            order: {
              id: createdOrder.id,
              brand: createdOrder.brand,
              cylinderSize: createdOrder.cylinder_size || createdOrder.cylinderSize || orderData.cylinderSize,
              quantity: createdOrder.quantity || orderData.quantity,
              finalPrice: createdOrder.final_price || createdOrder.finalPrice || '0',
              status: createdOrder.status || 'pending',
              deliveryAddress: createdOrder.delivery_address || createdOrder.deliveryAddress || orderData.deliveryAddress,
              paymentMethod: createdOrder.payment_method || createdOrder.paymentMethod || orderData.paymentMethod,
              createdAt: createdOrder.created_at || createdOrder.createdAt || new Date().toISOString(),
            },
          },
        });
        return;
      }

      // Fallback: no order data returned, just refresh list
      setShowCreateForm(false);
      await fetchOrders();
    } catch (error: any) {
      console.error('❌ Failed to create order:', error);
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
      console.log(`📤 Sending cancellation request for order ID: ${orderId}`);
      await request('delete', `/orders/${orderId}`);

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      addNotification('Order cancelled successfully', 'success');
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      const errorMsg = error.response?.data?.message || 'Failed to cancel order';
      addNotification(errorMsg, 'error');
    }
  };

  // Full-screen Form View
  if (showCreateForm) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4 sm:p-8 py-12">
          <CreateOrderModal
            isOpen={true}
            onClose={() => setShowCreateForm(false)}
            onSubmit={handleCreateOrder}
            isLoading={creating}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // Orders List View
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