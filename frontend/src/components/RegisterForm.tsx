// frontend/src/components/RegisterForm.tsx

import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
// import { useNotifications } from '../hooks/useNotifications';
import {
  validateEmail,
  validatePassword,
  validateFullName,
  validatePhone,
} from '../utils/validators';
import { Eye, EyeOff } from 'lucide-react';

export const RegisterForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isLoading, loginWithGoogle } = useAuth();
  // const { addNotification } = useNotifications();
  const [showPassword, setShowPassword] = useState(false);

  const role = searchParams.get('role') || 'customer';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    businessName: '',
    businessLicense: '',
    latitude: '',
    longitude: '',
    companyName: '',
    productCategory: '',
    taxId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!['customer', 'retailer', 'brand'].includes(role)) {
      navigate('/register-type');
    }
  }, [role, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message || 'Invalid password';
    }

    if (!validateFullName(formData.fullName)) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    if (role === 'retailer') {
      if (!formData.businessName.trim()) {
        newErrors.businessName = 'Business name is required';
      }
      if (!formData.businessLicense.trim()) {
        newErrors.businessLicense = 'Business license is required';
      }
      if (!formData.latitude || !formData.longitude) {
        newErrors.location = 'Business location is required';
      }
    }

    if (role === 'brand') {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required';
      }
      if (!formData.productCategory.trim()) {
        newErrors.productCategory = 'Product category is required';
      }
      if (!formData.taxId.trim()) {
        newErrors.taxId = 'Tax ID is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const registerData: any = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        role,
      };

      if (role === 'retailer') {
        registerData.businessName = formData.businessName;
        registerData.businessLicense = formData.businessLicense;
        registerData.latitude = parseFloat(formData.latitude);
        registerData.longitude = parseFloat(formData.longitude);
      }

      if (role === 'brand') {
        registerData.companyName = formData.companyName;
        registerData.productCategory = formData.productCategory;
        registerData.taxId = formData.taxId;
      }

      await register(registerData);
      // AuthContext.signup navigates to /verify-otp automatically
    } catch (error: any) {
      // AuthContext already shows the notification
    }
  };

  /**
   * GOOGLE SIGN-UP
   * Only available for customer role — retailers/brands must supply business details.
   * Google-registered customers default to role 'customer' on the backend.
   */
  const handleGoogleSignup = async () => {
    try {
      await loginWithGoogle();
      // AuthContext handles redirect + notifications
    } catch (error: any) {
      // AuthContext already shows the notification
    }
  };

  const getRoleTitle = () => {
    if (role === 'retailer') return 'Retailer Registration';
    if (role === 'brand') return 'Brand Partner Registration';
    return 'Customer Registration';
  };

  return (
    <div className="min-h-screen bg-gradient-blue-navy flex items-center py-12">
      <div className="container-custom w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-primary-900 mb-2">{getRoleTitle()}</h1>
          <p className="text-gray-600 mb-8">Create your {role} account</p>

          {/* GOOGLE SIGN-UP — customers only (retailers/brands need business fields) */}
          {role === 'customer' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isLoading}
                className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </button>

              {/* DIVIDER */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or register with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John Doe"
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+254 712 345 678"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
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
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* RETAILER FIELDS */}
            {role === 'retailer' && (
              <>
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold text-gray-700 mb-4">Business Information</h3>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.businessName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John's Gas Station"
                  />
                  {errors.businessName && (
                    <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business License</label>
                  <input
                    type="text"
                    value={formData.businessLicense}
                    onChange={(e) => setFormData({ ...formData, businessLicense: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.businessLicense ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="LIC12345"
                  />
                  {errors.businessLicense && (
                    <p className="text-red-500 text-sm mt-1">{errors.businessLicense}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.location ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="-1.2864"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.location ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="36.8172"
                    />
                  </div>
                </div>
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </>
            )}

            {/* BRAND FIELDS */}
            {role === 'brand' && (
              <>
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold text-gray-700 mb-4">Company Information</h3>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.companyName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="SafeGas Ltd"
                  />
                  {errors.companyName && (
                    <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Category</label>
                  <select
                    value={formData.productCategory}
                    onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.productCategory ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select category</option>
                    <option value="LPG">LPG Gas</option>
                    <option value="CNG">CNG Gas</option>
                    <option value="Bio">Bio Gas</option>
                  </select>
                  {errors.productCategory && (
                    <p className="text-red-500 text-sm mt-1">{errors.productCategory}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tax ID</label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.taxId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="TAX123456"
                  />
                  {errors.taxId && <p className="text-red-500 text-sm mt-1">{errors.taxId}</p>}
                </div>
              </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 font-semibold hover:text-primary-600">
              Sign in here
            </Link>
          </p>

          <p className="text-center text-sm text-gray-500 mt-4">
            <Link to="/register-type" className="hover:text-primary-500">
              Back to role selection
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};