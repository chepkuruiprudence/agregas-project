import { MapPin, CheckCircle2 } from 'lucide-react';
import { OrderTimeline } from './OrderTimeline';

interface OrderCardProps {
  order: {
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
  };
  onCancel?: (orderId: number) => void;
}

export const OrderCard = ({ order }: OrderCardProps) => {
  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6 hover:shadow-md transition-shadow">
      {/* Top Bar Info section */}
      <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Order #{order.id}</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${getStatusStyle(order.status)}`}>
            {order.status}
          </span>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Grid Summary Info details */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Item Column info */}
        <div>
          <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider">Product Details</h4>
          <p className="text-base font-bold text-gray-800 mt-1">
            {order.brand} <span className="text-gray-400 font-normal">({order.cylinderSize})</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Quantity item count: <span className="font-semibold text-gray-700">{order.quantity}</span></p>
        </div>

        {/* Location Information data row */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Address</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5 truncate max-w-[220px]">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        {/* Price Tag values column information */}
        <div className="md:text-right">
          <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider">Amount Billed</h4>
          <p className="text-2xl font-black text-gray-900 mt-0.5">
            {order.finalPrice} <span className="text-xs font-bold text-gray-400">KES</span>
          </p>
          <div className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 font-semibold px-2 py-0.5 rounded-md mt-1">
            <CheckCircle2 size={12} />
            <span className="uppercase">{order.paymentMethod} Payment</span>
          </div>
        </div>
      </div>

      {/* Interactive Timeline footer section track indicator tool */}
      <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-50">
        <OrderTimeline status={order.status} createdAt={order.createdAt} />
      </div>
    </div>
  );
};