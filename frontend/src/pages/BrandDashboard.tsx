import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useNotifications } from '../hooks/useNotifications';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Package, MapPin, TrendingUp, Gift, Plus, Eye, Edit2, Trash2 } from 'lucide-react';

interface BrandStats {
  totalProducts: number;
  activeRetailers: number;
  totalVolumeSold: number;
  totalCgcsIssued: number;
  monthlyRevenue: string;
  marketShare: string;
  averageRating: number;
  totalReviews: number;
}

interface Product {
  id: number;
  name: string;
  cylinderSize: string;
  basePrice: string;
  category: string;
  isActive: boolean;
}

interface Retailer {
  id: number;
  businessName: string;
  latitude: number;
  longitude: number;
  distance: number;
  isVerified: boolean;
  totalOrders: number;
  rating: number;
}

export const BrandDashboard = () => {
  const { request, loading } = useApi();
  const { addNotification } = useNotifications();

  const [stats, setStats] = useState<BrandStats>({
    totalProducts: 0,
    activeRetailers: 0,
    totalVolumeSold: 0,
    totalCgcsIssued: 0,
    monthlyRevenue: '0 KES',
    marketShare: '0%',
    averageRating: 0,
    totalReviews: 0,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [retailersLoading, setRetailersLoading] = useState(true);

  useEffect(() => {
    fetchBrandStats();
    fetchProducts();
    fetchRetailers();
  }, []);

  const fetchBrandStats = async () => {
    try {
      setStatsLoading(true);
      const response = await request('get', '/brand/stats');
      setStats(response.data || {});
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      addNotification('Failed to load statistics', 'error');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await request('get', '/brand/products');
      setProducts(Array.isArray(response.data) ? response.data : response.data?.products || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      addNotification('Failed to load products', 'error');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchRetailers = async () => {
    try {
      setRetailersLoading(true);
      const response = await request('get', '/brand/retailers');
      setRetailers(Array.isArray(response.data) ? response.data : response.data?.retailers || []);
    } catch (error: any) {
      console.error('Error fetching retailers:', error);
      addNotification('Failed to load retailer network', 'error');
    } finally {
      setRetailersLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await request('delete', `/brand/products/${productId}`);
      setProducts(products.filter(p => p.id !== productId));
      addNotification('Product deleted', 'success');
    } catch (error: any) {
      addNotification('Failed to delete product', 'error');
    }
  };

  // Stat Card Component
  const StatCard = ({ icon: Icon, label, value, loading: isLoading }: any) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl">
          <Icon size={24} className="text-orange-600" />
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container-custom py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-3">
              Brand Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Manage products, retailers, and track market performance
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <StatCard
              icon={Package}
              label="Total Products"
              value={stats.totalProducts}
              loading={statsLoading}
            />
            <StatCard
              icon={MapPin}
              label="Active Retailers"
              value={stats.activeRetailers}
              loading={statsLoading}
            />
            <StatCard
              icon={TrendingUp}
              label="Volume Sold (kg)"
              value={stats.totalVolumeSold.toLocaleString()}
              loading={statsLoading}
            />
            <StatCard
              icon={Gift}
              label="CGCs Issued"
              value={stats.totalCgcsIssued.toLocaleString()}
              loading={statsLoading}
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-600 text-sm font-medium mb-2">Monthly Revenue</p>
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
              ) : (
                <p className="text-4xl font-bold text-gray-900">{stats.monthlyRevenue}</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-600 text-sm font-medium mb-2">Market Share</p>
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
              ) : (
                <p className="text-4xl font-bold text-gray-900">{stats.marketShare}</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-600 text-sm font-medium mb-2">Average Rating</p>
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
              ) : (
                <div>
                  <p className="text-4xl font-bold text-gray-900">
                    {stats.averageRating.toFixed(1)}
                    <span className="text-lg text-gray-500 ml-2">⭐</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">({stats.totalReviews} reviews)</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Catalog */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
            <div className="border-b border-gray-100 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Product Catalog & Pricing</h2>
                <p className="text-gray-600 text-sm mt-1">Manage your gas product offerings</p>
              </div>
              <button className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition font-semibold">
                <Plus size={20} />
                Add Product
              </button>
            </div>

            {productsLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No products yet. Create your first product to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Product</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Size</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Base Price</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 text-gray-600">{product.cylinderSize}</td>
                        <td className="px-6 py-4 text-gray-900 font-semibold">{product.basePrice} KES</td>
                        <td className="px-6 py-4 text-gray-600">{product.category}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              product.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900">
                              <Eye size={18} />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900">
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Retailer Network */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Retailer Network</h2>
                <p className="text-gray-600 text-sm mt-1">Active retailers selling your products</p>
              </div>
              <button className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:border-gray-300 transition font-semibold">
                View Map
              </button>
            </div>

            {retailersLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              </div>
            ) : retailers.length === 0 ? (
              <div className="p-12 text-center">
                <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No retailers are carrying your products yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {retailers.map((retailer) => (
                  <div key={retailer.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{retailer.businessName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          📍 {retailer.distance}km away • {retailer.totalOrders} orders
                        </p>
                      </div>
                      <div className="text-right">
                        {retailer.isVerified && (
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full mb-2">
                            ✓ Verified
                          </span>
                        )}
                        <p className="text-2xl font-bold text-gray-900">{retailer.rating.toFixed(1)}</p>
                        <p className="text-sm text-gray-600">⭐ rating</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};