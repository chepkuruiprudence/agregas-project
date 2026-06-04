import { Truck } from 'lucide-react';

interface EmptyStateProps {
  onPlaceOrder: () => void;
}

export const EmptyState = ({ onPlaceOrder }: EmptyStateProps) => {
  return (
    <div className="bg-white p-8 sm:p-12 rounded-lg shadow text-center">
      <Truck size={56} className="mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
      <p className="text-gray-600 mb-6 text-sm sm:text-base">
        Start by placing your first order and enjoy seamless gas delivery to your doorstep.
      </p>
      <button
        onClick={onPlaceOrder}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition inline-block"
      >
        Place Your First Order
      </button>
    </div>
  );
};