import { useCallback, useState } from 'react';
import { useApi } from './useApi';
import { useNotifications } from './useNotifications';

interface Order {
  id: number;
  brand: string;
  cylinderSize: string;
  quantity: number;
  status: string;
  finalPrice: string;
  deliveryAddress: string;
  createdAt: string;
  retailerName: string;
}

export const useOrders = () => {
  const { request, loading } = useApi();
  const { addNotification } = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);

  /**
   * Fetch all orders for current customer
   */
  const fetchOrders = useCallback(async () => {
    try {
      console.log('📦 Fetching customer orders...');
      const response = await request('get', '/orders');
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        setOrders(response.data.data);
        console.log(`✓ ${response.data.data.length} orders loaded`);
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      addNotification('Failed to load orders', 'error');
      return [];
    }
  }, [request, addNotification]);

  /**
   * Get single order by ID
   */
  const getOrderById = useCallback(
    async (orderId: number) => {
      try {
        console.log(`📦 Fetching order #${orderId}...`);
        const response = await request('get', `/orders/${orderId}`);
        console.log(`✓ Order #${orderId} loaded`);
        return response.data?.data;
      } catch (error) {
        console.error(`❌ Error fetching order #${orderId}:`, error);
        addNotification('Failed to load order', 'error');
        return null;
      }
    },
    [request, addNotification]
  );

  /**
   * Create a new order
   */
  const createOrder = useCallback(
    async (orderData: {
      brand: string;
      cylinderSize: string;
      quantity: number;
      deliveryAddress: string;
      paymentMethod: string;
    }) => {
      try {
        console.log('➕ Creating order:', orderData);
        const response = await request('post', '/orders/create', orderData);
        
        addNotification(`Order #${response.data?.data?.id} created successfully!`, 'success');
        
        // Refresh orders
        await fetchOrders();
        
        console.log('✓ Order created:', response.data?.data);
        return response.data?.data;
      } catch (error) {
        console.error('❌ Error creating order:', error);
        addNotification('Failed to create order', 'error');
        return null;
      }
    },
    [request, addNotification, fetchOrders]
  );

  /**
   * Cancel an order
   */
  const cancelOrder = useCallback(
    async (orderId: number) => {
      try {
        console.log(`🗑️ Cancelling order #${orderId}...`);
        const response = await request('delete', `/orders/${orderId}`);
        
        addNotification(`Order #${orderId} cancelled`, 'success');
        
        // Refresh orders
        await fetchOrders();
        
        console.log(`✓ Order #${orderId} cancelled`);
        return true;
      } catch (error) {
        console.error(`❌ Error cancelling order #${orderId}:`, error);
        addNotification('Failed to cancel order', 'error');
        return false;
      }
    },
    [request, addNotification, fetchOrders]
  );

  /**
   * Update order status (admin/retailer only)
   */
  const updateOrderStatus = useCallback(
    async (
      orderId: number,
      newStatus: 'pending' | 'confirmed' | 'processing' | 'in_delivery' | 'delivered' | 'cancelled'
    ) => {
      try {
        console.log(`📝 Updating order #${orderId} status to: ${newStatus}`);
        const response = await request('put', `/orders/${orderId}/status`, {
          status: newStatus,
        });
        
        addNotification(`Order #${orderId} status updated`, 'success');
        
        // Refresh orders
        await fetchOrders();
        
        console.log(`✓ Order #${orderId} status updated`);
        return response.data?.data;
      } catch (error) {
        console.error(`❌ Error updating order #${orderId}:`, error);
        addNotification('Failed to update order status', 'error');
        return null;
      }
    },
    [request, addNotification, fetchOrders]
  );

  return {
    orders,
    loading,
    fetchOrders,
    getOrderById,
    createOrder,
    cancelOrder,
    updateOrderStatus,
  };
};