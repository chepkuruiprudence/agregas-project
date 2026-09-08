import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: {
    brand: string;
    cylinderSize: string;
    quantity: number;
    pricePerUnit: number;
  }) => void;
}

export const AddInventoryModal = ({ isOpen, onClose, onAdd }: AddInventoryModalProps) => {
  const { request, loading: apiLoading, error: apiError } = useApi();
  const [brands, setBrands] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingSizes, setLoadingSizes] = useState(false);

  const [formData, setFormData] = useState({
    brand: '',
    cylinderSize: '',
    quantity: '',
    pricePerUnit: '',
  });
  const [error, setError] = useState('');

  // Load brands on modal open
  useEffect(() => {
    if (isOpen) {
      fetchBrands();
    }
  }, [isOpen]);

  // Load sizes when brand selection changes
  useEffect(() => {
    if (formData.brand) {
      fetchSizesForBrand(formData.brand);
    } else {
      setAvailableSizes([]);
    }
  }, [formData.brand]);

  const fetchBrands = async () => {
    try {
      setLoadingBrands(true);
      setError('');

      // Uses Vite proxy rule matching /api -> http://localhost:3000/api/brands
      const resData = await request('get', '/brands');
      const brandsList = resData?.data || resData;

      if (Array.isArray(brandsList)) {
        const parsed = brandsList
          .map((b: any) => (typeof b === 'string' ? b : b.name || b.brand))
          .filter(Boolean);

        setBrands(Array.from(new Set(parsed)));
      }
    } catch (err: any) {
      console.error('Failed to load brands:', err);
      setError('Failed to load brands list');
    } finally {
      setLoadingBrands(false);
    }
  };

  const fetchSizesForBrand = async (brandName: string) => {
    try {
      setLoadingSizes(true);
      setAvailableSizes([]);

      // Uses Vite proxy matching /api -> http://localhost:3000/api/brand/products/by-brand/:brandName
      const resData = await request(
        'get',
        `/brand/products/by-brand/${encodeURIComponent(brandName)}`
      );
      const items = resData?.data || resData?.products || resData;

      if (Array.isArray(items)) {
        const parsedSizes = items
          .map((s: any) => (typeof s === 'string' ? s : s.cylinderSize || s.cylinder_size || s.size))
          .filter(Boolean);

        setAvailableSizes(Array.from(new Set(parsedSizes)));
      }
    } catch (err: any) {
      console.error('Failed to load sizes:', err);
      setAvailableSizes([]);
    } finally {
      setLoadingSizes(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'brand') {
      setFormData((prev) => ({
        ...prev,
        brand: value,
        cylinderSize: '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.brand) {
      setError('Brand is required');
      return;
    }
    if (!formData.cylinderSize) {
      setError('Cylinder size is required');
      return;
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    onAdd({
      brand: formData.brand,
      cylinderSize: formData.cylinderSize,
      quantity: parseInt(formData.quantity),
      pricePerUnit: parseFloat(formData.pricePerUnit),
    });

    setFormData({
      brand: '',
      cylinderSize: '',
      quantity: '',
      pricePerUnit: '',
    });
    setAvailableSizes([]);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
            <h2 className="text-2xl font-bold text-gray-900">Add Stock</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {(error || apiError) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error || apiError}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Brand *
              </label>
              {loadingBrands ? (
                <div className="text-gray-500 text-sm py-1">Loading brands...</div>
              ) : (
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a brand</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {formData.brand && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cylinder Size *
                </label>
                {loadingSizes ? (
                  <div className="text-gray-500 text-sm py-1">Loading sizes...</div>
                ) : availableSizes.length > 0 ? (
                  <select
                    name="cylinderSize"
                    value={formData.cylinderSize}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select size</option>
                    {availableSizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-gray-500 text-sm py-1">
                    No sizes available for {formData.brand}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity to Add *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="e.g., 50"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price per Unit (KSh) *
              </label>
              <input
                type="number"
                name="pricePerUnit"
                value={formData.pricePerUnit}
                onChange={handleChange}
                placeholder="e.g., 850"
                min="0.01"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {formData.quantity && formData.pricePerUnit && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  Total Value: <span className="font-bold text-primary-600">
                    KSh {(parseInt(formData.quantity) * parseFloat(formData.pricePerUnit) || 0).toLocaleString()}
                  </span>
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                ℹ️ This stock is added to your retailer account only.
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={apiLoading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold transition disabled:opacity-50"
              >
                {apiLoading ? 'Processing...' : 'Add Stock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};