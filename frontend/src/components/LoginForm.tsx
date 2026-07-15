// frontend/src/components/LoginForm.tsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
// import { useNotifications } from '../hooks/useNotifications';
import { validateEmail, validatePassword } from '../utils/validators';
import { Eye, EyeOff, Fingerprint } from 'lucide-react';

export const LoginForm = () => {
  const navigate = useNavigate();
  const { login, isLoading, loginWithPasskey } = useAuth();
  // const { addNotification } = useNotifications();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message || 'Invalid password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Helper: navigate to role-appropriate dashboard
   */
  const redirectToDashboard = () => {
    const storedUser = localStorage.getItem('agregas_user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    const role = currentUser?.role;

    if (role === 'customer') navigate('/dashboard/customer');
    else if (role === 'retailer') navigate('/dashboard/retailer');
    else if (role === 'brand') navigate('/dashboard/brand');
    else if (role === 'admin') navigate('/dashboard/admin');
    else navigate('/');
  };

  /**
   * TRADITIONAL LOGIN: Email + Password
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await login({
        email: formData.email,
        password: formData.password,
        rememberMe,
      });
      // AuthContext already navigates to dashboard on success
    } catch (error: any) {
      // AuthContext already calls addNotification; nothing extra needed here
    }
  };

  /**
   * PASSKEY LOGIN (WebAuthn/Biometric) — wired up but intentionally non-functional until Phase 7
   */
  const handlePasskeyLogin = async () => {
    try {
      await loginWithPasskey();
      setTimeout(redirectToDashboard, 500);
    } catch (error: any) {
      // AuthContext handles the notification
    }
  };

  return (
    <div className="min-h-screen bg-gradient-blue-navy flex items-center py-12">
      <div className="container-custom w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-primary-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600 mb-8">Sign in to your AGREGAS account</p>

          {/* PASSKEY OPTION */}
          <button
            type="button"
            onClick={handlePasskeyLogin}
            disabled={isLoading}
            className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary-500 text-primary-500 rounded-lg font-semibold hover:bg-primary-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Fingerprint size={20} />
            Sign in with Passkey
          </button>

          {/* DIVIDER */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign in with email</span>
            </div>
          </div>

          {/* EMAIL + PASSWORD FORM */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
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

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
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

            {/* Remember Me + Forgot Password row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-700 cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-500 hover:text-primary-600 font-semibold"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* SIGN UP LINK */}
          <p className="text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/register-type" className="text-primary-500 font-semibold hover:text-primary-600">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};