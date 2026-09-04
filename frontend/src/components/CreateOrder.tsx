// frontend/src/components/CreateOrderModal.tsx
// WITH: Loading states, "No brands available" message, Geolocation permission prompt

import { useState, useEffect } from 'react';
import { X, MapPin, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface Brand {
  id: string;
  name: string;
  productCount?: number;
}

interface Product {
  id: number;
  brand: string;
  cylinder_size: string;
  base_price: string;
  description?: string;
  is_active: boolean;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  isLoading: boolean;
}

export const CreateOrderModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CreateOrderModalProps) => {
  const { request } = useApi();

  // Form state
  const [formData, setFormData] = useState({
    brand: '',
    cylinderSize: '',
    quantity: 1,
    latitude: '',
    longitude: '',
    deliveryAddress: '',
    paymentMethod: 'mpesa',
  });

  // UI state
  const [gettingLocation, setGettingLocation] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Data state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cylinderSizes, setCylinderSizes] = useState<string[]>([]);
  const [maxAvailableQty, setMaxAvailableQty] = useState<number>(0);
  const [quantityWarning, setQuantityWarning] = useState<string>('');

  if (!isOpen) return null;

  // ========== FETCH BRANDS ON MOUNT ==========
  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
  try {
    setLoadingBrands(true);
    console.log('📡 Fetching brands from backend...');
    
    const response = await request('get', '/brands');
    console.log('✓ Brands response:', response);

    // If your helper returns the raw data payload directly:
    const brandList = Array.isArray(response) ? response : response?.data;

    if (Array.isArray(brandList)) {
      if (brandList.length === 0) {
        console.warn('⚠️ No brands returned from backend');
        setBrands([]);
        setErrors((prev) => ({
          ...prev,
          brands: 'No brands available. Please contact support.',
        }));
      } else {
        console.log(`✓ Loaded ${brandList.length} brands`);
        setBrands(brandList);
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.brands;
          return newErrors;
        });
      }
    } else {
      console.error('❌ Invalid response format:', response);
      setBrands([]);
      setErrors((prev) => ({
        ...prev,
        brands: 'Failed to load brands. Invalid response format.',
      }));
    }
  } catch (error) {
    console.error('❌ Error fetching brands:', error);
    setBrands([]);
    setErrors((prev) => ({
      ...prev,
      brands: 'Failed to load brands. Please check your connection.',
    }));
  } finally {
    setLoadingBrands(false);
  }
};

  // ========== FETCH PRODUCTS BY BRAND ==========
  useEffect(() => {
    if (formData.brand) {
      fetchProductsForBrand(formData.brand);
      setFormData((prev) => ({
        ...prev,
        cylinderSize: '',
        quantity: 1,
      }));
    }
  }, [formData.brand]);

  const fetchProductsForBrand = async (brandName: string) => {
  try {
    setLoadingProducts(true);
    console.log(`📡 Fetching products for brand: ${brandName}`);
    
    const response = await request('get', `/brand/products/by-brand/${brandName}`);
    console.log('✓ Products response:', response);

    // Unify payload extraction: handle direct array or nested { data: [...] } structure
    const productsList = Array.isArray(response)
      ? response
      : response?.data?.data || response?.data;

    if (Array.isArray(productsList)) {
      if (productsList.length === 0) {
        console.warn(`⚠️ No products found for brand: ${brandName}`);
        setProducts([]);
        setCylinderSizes([]);
      } else {
        setProducts(productsList);

        // Extract unique cylinder sizes safely
        const sizes = [
          ...new Set(
            productsList
              .map((p: Product) => p.cylinder_size)
              .filter(Boolean)
          ),
        ].sort((a, b) => parseInt(a as string) - parseInt(b as string));

        setCylinderSizes(sizes as string[]);
        console.log(`✓ Found ${sizes.length} cylinder sizes:`, sizes);
      }
    } else {
      console.error('❌ Unexpected products response format:', response);
      setProducts([]);
      setCylinderSizes([]);
    }
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    setProducts([]);
    setCylinderSizes([]);
  } finally {
    setLoadingProducts(false);
  }
};

  // ========== UPDATE MAX QUANTITY ==========
  useEffect(() => {
    if (formData.brand && formData.cylinderSize) {
      updateMaxQuantity();
    }
  }, [formData.brand, formData.cylinderSize, products]);

  const updateMaxQuantity = () => {
    const selectedProduct = products.find(
      (p) =>
        p.brand.toLowerCase() === formData.brand.toLowerCase() &&
        p.cylinder_size === formData.cylinderSize
    );

    if (selectedProduct) {
      const max = 1000;
      setMaxAvailableQty(max);
      setQuantityWarning('');

      if (formData.quantity > max) {
        setFormData((prev) => ({ ...prev, quantity: max }));
      }
    } else {
      setMaxAvailableQty(0);
    }
  };

  // ========== QUANTITY VALIDATION ==========
  useEffect(() => {
    if (formData.quantity && maxAvailableQty > 0) {
      if (formData.quantity > maxAvailableQty) {
        setQuantityWarning(
          `Only ${maxAvailableQty} units available. Please reduce quantity.`
        );
      } else {
        setQuantityWarning('');
      }
    }
  }, [formData.quantity, maxAvailableQty]);

  // ========== GEOLOCATION HANDLER ==========
  const handleUseMyLocation = () => {
    setLocationError('');
    setLocationSuccess(false);

    if (!navigator.geolocation) {
      setLocationError(
        '❌ Geolocation is not supported by your browser. Please enter coordinates manually.'
      );
      return;
    }

    setGettingLocation(true);
    console.log('📍 Requesting geolocation permission from browser...');

    const timeoutId = setTimeout(() => {
      setGettingLocation(false);
      setLocationError(
        '⏱️ Location request timed out. Please check your internet connection or enter coordinates manually.'
      );
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const { latitude, longitude } = position.coords;

        console.log(`✓ Location granted: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);

        setFormData((prev) => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));

        setLocationSuccess(true);
        setLocationError('');
        setGettingLocation(false);

        setTimeout(() => setLocationSuccess(false), 3000);
      },
      (error) => {
        clearTimeout(timeoutId);
        setGettingLocation(false);

        console.error('❌ Geolocation error:', error.code, error.message);

        let errorMessage = 'Could not get your location. Please enter it manually.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = `❌ Location permission DENIED by user or browser.

To enable location sharing:

📱 Chrome/Edge:
  1. Click the lock 🔒 icon in the address bar
  2. Find "Location" setting
  3. Change from "Block" to "Allow"
  4. Refresh the page
  5. Try again

🦊 Firefox:
  1. Click the info ℹ️ icon in the address bar
  2. Click Permissions
  3. Enable "Location"
  4. Refresh the page
  5. Try again

🧭 Safari (Mac):
  1. Go to Safari → Settings
  2. Privacy tab → Location Services
  3. Set to "Allow"

Or simply enter your coordinates manually below.`;
            break;

          case error.POSITION_UNAVAILABLE:
            errorMessage = `📍 Your location is currently unavailable.

This means:
• GPS is disabled on your device
• Location signal is too weak
• You're in an area with no GPS coverage

Solutions:
1. Enable GPS on your device
2. Move to a location with better GPS signal
3. Or enter coordinates manually below`;
            break;

          case error.TIMEOUT:
            errorMessage = `⏱️ Location request timed out.

This usually happens because:
• Slow internet connection
• Weak GPS signal
• Browser is having trouble accessing location

Try again or enter coordinates manually below.`;
            break;

          default:
            errorMessage = `⚠️ Unexpected error (Code: ${error.code}). Please enter coordinates manually.`;
        }

        setLocationError(errorMessage);
      }
    );
  };

  // ========== FORM VALIDATION ==========
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.brand) newErrors.brand = 'Please select a brand';
    if (!formData.cylinderSize) newErrors.cylinderSize = 'Please select cylinder size';
    if (formData.quantity < 1) newErrors.quantity = 'Quantity must be at least 1';
    if (formData.quantity > maxAvailableQty)
      newErrors.quantity = `Maximum ${maxAvailableQty} units available`;
    if (!formData.latitude) newErrors.latitude = 'Latitude is required';
    if (!formData.longitude) newErrors.longitude = 'Longitude is required';
    if (!formData.deliveryAddress) newErrors.deliveryAddress = 'Delivery address is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========== SUBMIT HANDLER ==========
  // ========== SUBMIT HANDLER ==========
const handleSubmit = async (e?: React.FormEvent) => {
  // Safe guard preventDefault in case handleSubmit is invoked without an event object
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  if (!validateForm()) return;

  try {
    const orderData = {
      purchaseType: 'refill', // Assuming default purchase type is 'refill'
      brand: formData.brand,
      cylinderSize: formData.cylinderSize,
      quantity: formData.quantity,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      deliveryAddress: formData.deliveryAddress,
      paymentMethod: formData.paymentMethod,
    };

    // Pass ONLY orderData to parent onSubmit handler
    await onSubmit(orderData);

    // Reset form after successful submission
    setFormData({
      brand: '',
      cylinderSize: '',
      quantity: 1,
      latitude: '',
      longitude: '',
      deliveryAddress: '',
      paymentMethod: 'mpesa',
    });
    setErrors({});
  } catch (error) {
    console.error('❌ Error submitting order:', error);
  }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Place Order</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Brand Dropdown - WITH LOADING STATE */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Brand <span className="text-red-500">*</span>
            </label>

            {loadingBrands ? (
              // LOADING STATE
              <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <Loader size={18} className="text-blue-600 animate-spin" />
                <span className="text-blue-700 font-medium">Loading brands...</span>
              </div>
            ) : brands.length === 0 ? (
              // NO BRANDS AVAILABLE
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700 font-medium">
                    No brands available. Please refresh or contact support.
                  </div>
                </div>
              </div>
            ) : (
              // BRANDS LOADED
              <select
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.brand ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a brand ({brands.length} available)</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.name}>
                    {brand.name}
                  </option>
                ))}
              </select>
            )}
            {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
          </div>

          {/* Cylinder Size Dropdown - WITH LOADING STATE */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cylinder Size <span className="text-red-500">*</span>
            </label>

            {loadingProducts ? (
              // LOADING STATE
              <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <Loader size={18} className="text-blue-600 animate-spin" />
                <span className="text-blue-700 font-medium">Loading sizes...</span>
              </div>
            ) : (
              <select
                value={formData.cylinderSize}
                onChange={(e) => setFormData({ ...formData, cylinderSize: e.target.value })}
                disabled={!formData.brand || cylinderSizes.length === 0}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                  errors.cylinderSize ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {!formData.brand
                    ? 'Select brand first'
                    : cylinderSizes.length === 0
                    ? 'No sizes available'
                    : `Select size (${cylinderSizes.length} available)`}
                </option>
                {cylinderSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            )}
            {errors.cylinderSize && (
              <p className="text-red-500 text-sm mt-1">{errors.cylinderSize}</p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Quantity (kg) <span className="text-red-500">*</span>
              </label>
              {maxAvailableQty > 0 && (
                <span className="text-xs text-gray-600">
                  Available: <strong>{maxAvailableQty}</strong>
                </span>
              )}
            </div>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
              }
              disabled={!formData.cylinderSize}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                errors.quantity || quantityWarning ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {quantityWarning && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                ⚠️ {quantityWarning}
              </p>
            )}
            {errors.quantity && !quantityWarning && (
              <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Location Section */}
          <div className="border-t pt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Delivery Location <span className="text-red-500">*</span>
            </label>

            {/* Error Message */}
            {locationError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700 whitespace-pre-line font-medium">
                    {locationError}
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {locationSuccess && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex gap-2 items-center">
                  <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                  <div className="text-sm text-green-700 font-medium">
                    ✅ Location retrieved successfully!
                  </div>
                </div>
              </div>
            )}

            {/* Coordinate Inputs */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Latitude</label>
                <input
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => {
                    setFormData({ ...formData, latitude: e.target.value });
                    setLocationError('');
                  }}
                  placeholder="-1.286389"
                  className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.latitude ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Longitude</label>
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => {
                    setFormData({ ...formData, longitude: e.target.value });
                    setLocationError('');
                  }}
                  placeholder="36.817223"
                  className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.longitude ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>

            {/* Use My Location Button - WITH PERMISSION PROMPT */}
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={gettingLocation || isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border-2 border-blue-300 text-blue-600 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <MapPin size={18} />
              {gettingLocation ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Browser is requesting location permission...
                </>
              ) : (
                '📍 Use My Current Location'
              )}
            </button>

            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Click the button above. Your browser will ask for location permission. Click "Allow" to auto-fill coordinates, or enter manually.
            </p>

            {/* Location Errors */}
            {(errors.latitude || errors.longitude) && (
              <p className="text-red-500 text-sm mt-2">
                {errors.latitude || errors.longitude}
              </p>
            )}
          </div>

          {/* Delivery Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Delivery Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
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
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mpesa">M-Pesa</option>
              <option value="card">Credit/Debit Card</option>
              <option value="cash">Cash on Delivery</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
    type="submit"
    disabled={
      isLoading ||
      !formData.brand ||
      !formData.cylinderSize ||
      quantityWarning !== '' ||
      Object.keys(errors).length > 0
    }
    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
  >
    {isLoading ? '⏳ Placing Order...' : '✅ Place Order'}
  </button>
        </form>
      </div>
    </div>
  );
};