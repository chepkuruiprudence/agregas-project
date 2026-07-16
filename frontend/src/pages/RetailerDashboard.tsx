// frontend/src/pages/RetailerDashboard.tsx

import { useState } from 'react';
import { Plus, Package, Truck, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AddInventoryModal } from '../components/AddInventoryModal';
import { OrderQueueCard } from '../components/OrderQueueCard';
import { InventoryCard } from '../components/InventoryCard'; 
import { StatsCard } from '../components/RetailerStatsCard';

interface InventoryItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
}

interface Order {
  id: string;
  customerName: string;
  quantity: number;
  price: number;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
}

export const RetailerDashboard = () => {
  const { user } = useAuth();
  
  // State Management
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', productName: '6kg Cylinder', quantity: 15, price: 850, unit: 'cylinder' },
    { id: '2', productName: '13kg Cylinder', quantity: 8, price: 1500, unit: 'cylinder' },
  ]);
  
  const [orders, setOrders] = useState<Order[]>([
    { id: 'ORD-001', customerName: 'John Doe', quantity: 2, price: 1700, status: 'pending', createdAt: '2024-01-15' },
    { id: 'ORD-002', customerName: 'Jane Smith', quantity: 1, price: 850, status: 'in-progress', createdAt: '2024-01-14' },
    { id: 'ORD-003', customerName: 'Peter Johnson', quantity: 3, price: 2550, status: 'completed', createdAt: '2024-01-13' },
  ]);

  // Handle Add Inventory
  const handleAddInventory = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: Date.now().toString(),
    };
    setInventory([...inventory, newItem]);
    setShowAddInventory(false);
    
    // Optional: Show success message
    console.log('✓ Inventory added:', newItem);
  };

  // Handle Update Order Status
  const handleUpdateOrderStatus = (orderId: string, status: 'pending' | 'in-progress' | 'completed') => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
    console.log(`✓ Order ${orderId} updated to ${status}`);
  };

  // Calculate Stats
  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container-custom py-6">
          <h1 className="text-3xl font-bold text-gray-900">Retailer Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage inventory and orders</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={Package}
            label="Total Inventory"
            value={inventory.length}
            subtext={`KSh ${totalInventoryValue.toLocaleString()}`}
          />
          <StatsCard
            icon={Truck}
            label="Total Orders"
            value={totalOrders}
            subtext={`${completedOrders} completed`}
          />
          <StatsCard
            icon={TrendingUp}
            label="Pending Orders"
            value={pendingOrders}
            subtext="Awaiting fulfillment"
          />
          <StatsCard
            icon={TrendingUp}
            label="Completed Orders"
            value={completedOrders}
            subtext="This month"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Inventory */}
          <div className="lg:col-span-2">
            {/* Inventory Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
                <p className="text-gray-600 text-sm mt-1">{inventory.length} products available</p>
              </div>
              <button
                onClick={() => setShowAddInventory(true)}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition font-semibold"
              >
                <Plus size={20} />
                Add Stock
              </button>
            </div>

            {/* Inventory Items */}
            <div className="space-y-4">
              {inventory.length > 0 ? (
                inventory.map(item => (
                  <InventoryCard 
                    key={item.id} 
                    item={item}
                    onDelete={(id) => setInventory(inventory.filter(i => i.id !== id))}
                  />
                ))
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Package size={40} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">No inventory items yet</p>
                  <button
                    onClick={() => setShowAddInventory(true)}
                    className="text-primary-600 font-semibold mt-2 hover:text-primary-700"
                  >
                    Add your first item
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Orders */}
          <div className="lg:col-span-1">
            {/* Orders Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
              <p className="text-gray-600 text-sm mt-1">{pendingOrders} pending</p>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {orders.length > 0 ? (
                orders.map(order => (
                  <OrderQueueCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleUpdateOrderStatus}
                  />
                ))
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Truck size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 text-sm">No orders yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Inventory Modal */}
      {showAddInventory && (
        <AddInventoryModal
          isOpen={showAddInventory}
          onClose={() => setShowAddInventory(false)}
          onAdd={handleAddInventory}
        />
      )}
    </div>
  );
};