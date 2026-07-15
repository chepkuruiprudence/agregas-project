import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { useNotifications } from '../hooks/useNotifications';
import { Eye, EyeOff } from 'lucide-react';

export const ProfileForm = () => {
  const { user } = useAuth();
  const { request, loading } = useApi();
  const { addNotification } = useNotifications();
  const [showPassword, setShowPassword] = useState(false);
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    // Retailer fields
    businessName: '',
    businessLicense: '',
    latitude: '',
    longitude: '',
    // Brand fields
    companyName: '',
    productCategory: '',
    taxId: '',
    // Password (optional)
    currentPassword: '',
    newPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch full user profile
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await request('get', '/users/profile');
      if (response.data) {
        setFormData((prev) => ({
          ...prev,
          ...response.data,
        }));
      }
    } catch (error) {
      addNotification('Failed to load profile', 'error');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Invalid email';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const updateData: any = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      };

      // Add role-specific fields
      if (user?.role === 'retailer') {
        updateData.businessName = formData.businessName;
        updateData.businessLicense = formData.businessLicense;
        updateData.latitude = formData.latitude;
        updateData.longitude = formData.longitude;
      }

      if (user?.role === 'brand') {
        updateData.companyName = formData.companyName;
        updateData.productCategory = formData.productCategory;
        updateData.taxId = formData.taxId;
      }

      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      await request('put', '/users/profile', updateData);
      addNotification('Profile updated successfully!', 'success');
      setEditing(false);
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
      }));
    } catch (error: any) {
      addNotification(
        error.response?.data?.message || 'Failed to update profile',
        'error'
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-8 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary-900">
          {user?.role === 'customer' && 'My Profile'}
          {user?.role === 'retailer' && 'Business Profile'}
          {user?.role === 'brand' && 'Company Profile'}
          {user?.role === 'admin' && 'Admin Profile'}
        </h2>
        <button
          onClick={() => setEditing(!editing)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-semibold"
        >
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Base Fields (All Roles) */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              disabled={!editing}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!editing}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!editing}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Role
            </label>
            <input
              type="text"
              value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : ''}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
                
        {/* RETAILER FIELDS */}
        {user?.role === 'retailer' && editing && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Business Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData
                    
                    
                    
                    
                    
                    
                    
                    , businessName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business License
                </label>
                <input
                  type="text"
                  value={formData.businessLicense}
                  onChange={(e) => setFormData({ ...formData, businessLicense: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* BRAND FIELDS */}
        {user?.role === 'brand' && editing && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Company Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Category
                </label>
                <input
                  type="text"
                  value={formData.productCategory}
                  onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tax ID
                </label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Change Password (Only when editing) */}
        {editing && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Change Password (Optional)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, currentPassword: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff size={20} className="text-gray-400" />
                    ) : (
                      <Eye size={20} className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {editing && (
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};