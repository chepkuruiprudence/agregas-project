import { useState } from 'react';
import { X, MapPin } from 'lucide-react';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
  formData: {
    purchaseType?: 'refill' | 'outright';
    brand: string;
    cylinderSize: string;
    quantity: number;
    latitude: string;
    longitude: string;
    deliveryAddress: string;
    paymentMethod: string;
  };
  onFormChange: (data: any) => void;
  errors: Record<string, string>;
}

export const CreateOrderModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  formData,
  onFormChange,
  errors,
}: CreateOrderModalProps) => {
  const [gettingLocation, setGettingLocation] = useState(false);

  if (!isOpen) return null;

  /**
   * Get user's current location
   */
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onFormChange({
          ...formData,
          latitude: latitude.toFixed(4),
          longitude: longitude.toFixed(4),
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not get your location. Please enter it manually.');
        setGettingLocation(false);
      }
    );
  };

  // ✅ Standalone page container (fixed layout overlays completely removed)
  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full border border-gray-100 my-6">
      <div className="flex justify-between items-center mb-6 bg-white">
        <h2 className="text-2xl font-bold text-gray-900">Place Order</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition flex items-center gap-1 text-sm font-medium"
        >
          <X size={18} />
          Cancel
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Brand */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Brand
          </label>
          <select
            value={formData.brand}
            onChange={(e) => onFormChange({ ...formData, brand: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              errors.brand ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a brand</option>
            <option value="SafeGas">SafeGas</option>
            <option value="ProGas">ProGas</option>
            <option value="EcoGas">EcoGas</option>
            <option value="TotalGas">Total Gas</option>
            <option value="BritishGas">British Gas</option>
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
            onChange={(e) => onFormChange({ ...formData, cylinderSize: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              errors.cylinderSize ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select size</option>
            <option value="6kg">6kg (Small)</option>
            <option value="13kg">13kg (Standard)</option>
            <option value="50kg">50kg (Commercial)</option>
          </select>
          {errors.cylinderSize && (
            <p className="text-red-500 text-sm mt-1">{errors.cylinderSize}</p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Quantity (kg)
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={formData.quantity}
            onChange={(e) =>
              onFormChange({ ...formData, quantity: parseInt(e.target.value) || 1 })
            }
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              errors.quantity ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="1"
          />
          {errors.quantity && (
            <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
          )}
        </div>

        {/* Latitude & Longitude */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Location (Latitude & Longitude)
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Latitude</label>
              <input
                type="text"
                value={formData.latitude}
                onChange={(e) =>
                  onFormChange({ ...formData, latitude: e.target.value })
                }
                placeholder="-1.2864"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm ${
                  errors.latitude ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Longitude</label>
              <input
                type="text"
                value={formData.longitude}
                onChange={(e) =>
                  onFormChange({ ...formData, longitude: e.target.value })
                }
                placeholder="36.8172"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm ${
                  errors.longitude ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
          </div>
          
          {/* Use My Location Button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={gettingLocation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm font-medium"
          >
            <MapPin size={16} />
            {gettingLocation ? 'Getting location...' : 'Use my location'}
          </button>

          {(errors.latitude || errors.longitude) && (
            <p className="text-red-500 text-sm mt-2">
              {errors.latitude || errors.longitude}
            </p>
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
              onFormChange({ ...formData, deliveryAddress: e.target.value })
            }
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              errors.deliveryAddress ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your delivery address"
            rows={2}
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
              onFormChange({ ...formData, paymentMethod: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="mpesa">M-Pesa</option>
            <option value="card">Credit/Debit Card</option>
            <option value="cash">Cash on Delivery</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {isLoading ? 'Placing Order...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
};