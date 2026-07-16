// frontend/src/components/OrderQueueCard.tsx

import { Truck, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  quantity: number;
  price: number;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
}

interface OrderQueueCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: 'pending' | 'in-progress' | 'completed') => void;
}

export const OrderQueueCard = ({ order, onStatusChange }: OrderQueueCardProps) => {
  const statusColors = {
    pending: 'bg-yellow-50 border-yellow-200',
    'in-progress': 'bg-blue-50 border-blue-200',
    completed: 'bg-green-50 border-green-200',
  };

  const statusTextColors = {
    pending: 'text-yellow-700',
    'in-progress': 'text-blue-700',
    completed: 'text-green-700',
  };

  const statusIcons = {
    pending: <AlertCircle size={16} />,
    'in-progress': <Truck size={16} />,
    completed: <CheckCircle size={16} />,
  };

  const nextStatuses: Record<string, 'pending' | 'in-progress' | 'completed'> = {
    pending: 'in-progress',
    'in-progress': 'completed',
    completed: 'pending',
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${statusColors[order.status]} transition`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm text-gray-600">Order #{order.id}</p>
          <p className="font-semibold text-gray-900">{order.customerName}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${statusTextColors[order.status]}`}>
          {statusIcons[order.status]}
          <span className="capitalize">{order.status}</span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Quantity:</span>
          <span className="font-semibold text-gray-900">{order.quantity} units</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Amount:</span>
          <span className="font-semibold text-gray-900">KSh {order.price.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Date:</span>
          <span>{order.createdAt}</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onStatusChange(order.id, nextStatuses[order.status])}
        className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition ${
          order.status === 'completed'
            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        {order.status === 'completed' ? 'Reset' : 'Move Next'}
      </button>
    </div>
  );
};

// ============================================================================

// frontend/src/components/InventoryCard.tsx

import { Package, Trash2, Edit2 } from 'lucide-react';

interface InventoryItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
}

interface InventoryCardProps {
  item: InventoryItem;
  onDelete: (id: string) => void;
}

export const InventoryCard = ({ item, onDelete }: InventoryCardProps) => {
  const totalValue = item.quantity * item.price;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Package size={20} className="text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{item.productName}</h3>
            <p className="text-xs text-gray-500 capitalize">{item.unit}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600">
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-600 mb-1">Quantity</p>
          <p className="text-lg font-bold text-gray-900">{item.quantity}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Price/Unit</p>
          <p className="text-lg font-bold text-primary-600">KSh {item.price}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Total Value</p>
          <p className="text-lg font-bold text-gray-900">KSh {totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Low Stock Warning */}
      {item.quantity < 5 && (
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
          <p className="text-xs text-yellow-700 font-semibold">⚠️ Low stock warning</p>
        </div>
      )}
    </div>
  );
};