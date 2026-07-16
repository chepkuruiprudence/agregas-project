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
  onEdit?: (item: InventoryItem) => void;
}

export const InventoryCard = ({ item, onDelete, onEdit }: InventoryCardProps) => {
  const totalValue = item.quantity * item.price;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      {/* Header with Icon and Title */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className="p-2 bg-primary-100 rounded-lg flex-shrink-0">
            <Package size={20} className="text-primary-600" />
          </div>
          
          {/* Title and Unit */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{item.productName}</h3>
            <p className="text-xs text-gray-500 capitalize">{item.unit}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(item)}
              className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600 hover:text-blue-700"
              title="Edit inventory"
            >
              <Edit2 size={16} />
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 hover:bg-red-100 rounded-lg transition text-red-600 hover:text-red-700"
            title="Delete inventory"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Quantity</p>
          <p className="text-lg font-bold text-gray-900">{item.quantity}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Price/Unit</p>
          <p className="text-lg font-bold text-primary-600">KSh {item.price}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Total Value</p>
          <p className="text-lg font-bold text-gray-900">KSh {totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Low Stock Warning */}
      {item.quantity < 5 && (
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded px-3 py-2 flex items-center gap-2">
          <span className="text-yellow-600">⚠️</span>
          <p className="text-xs text-yellow-700 font-semibold">Low stock - only {item.quantity} left</p>
        </div>
      )}
    </div>
  );
};