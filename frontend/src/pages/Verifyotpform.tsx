// frontend/src/pages/VerifyOTPForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export const VerifyOTPForm = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [searchParams] = useSearchParams();
  const { verifyOTP, resendOTP, isLoading } = useAuth();
  const { addNotification } = useNotifications();

  // Get email from URL: /verify-otp?email=user@gmail.com
  const emailFromUrl = searchParams.get('email');
  const [email] = useState(emailFromUrl || '');

  // Extract the registration data sent from the registration form step state
  const signupData = location.state || {}; 

  // OTP Input (6 digits)
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  
  // Timer for "Resend OTP" button
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Check if we have email and necessary password parameters
  useEffect(() => {
    if (!email || !signupData.password) {
      addNotification('Missing registration details. Please register first.', 'error');
      navigate('/register-type');
    }
  }, [email, signupData.password, navigate, addNotification]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  /**
   * Validate OTP: Must be exactly 6 digits
   */
  const validateOTP = (): boolean => {
    if (otp.length !== 6) {
      setOtpError('OTP must be 6 digits');
      return false;
    }
    if (!/^\d{6}$/.test(otp)) {
      setOtpError('OTP must contain only numbers');
      return false;
    }
    setOtpError('');
    return true;
  };

  /**
   * Handle OTP Verification
   * This completes the signup process
   */
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateOTP()) return;

    try {
      console.log(`🔐 [OTP VERIFY] Verifying OTP for ${email}`);

      // Pass ALL 6 required arguments to match your AuthContext definition
      await verifyOTP(
        email,
        otp,
        signupData.password,
        signupData.fullName,
        signupData.phone || '',
        signupData.role
      );

      addNotification('Account verified successfully!', 'success');
    } catch (error: any) {
      console.error('❌ OTP verification error:', error);
      setOtpError(error.response?.data?.message || 'OTP verification failed');
    }
  };

  /**
   * Resend OTP to email
   */
  const handleResendOTP = async () => {
    try {
      setIsResending(true);
      console.log(`🔄 [RESEND OTP] Sending new OTP to ${email}`);

      await resendOTP(email);

      addNotification('OTP resent to your email', 'success');
      setResendTimer(60); // 60 second cooldown
      setOtp(''); // Clear previous OTP
      setOtpError('');
    } catch (error: any) {
      console.error('❌ Resend OTP error:', error);
      setOtpError(error.response?.data?.message || 'Failed to resend OTP');
      addNotification('Failed to resend OTP', 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-blue-navy flex items-center py-12">
      <div className="container-custom w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <CheckCircle2 size={48} className="mx-auto text-primary-500 mb-4" />
            <h1 className="text-3xl font-bold text-primary-900 mb-2">Verify Email</h1>
            <p className="text-gray-600">
              We sent a 6-digit code to<br />
              <span className="font-semibold">{email}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enter Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setOtp(value);
                  setOtpError('');
                }}
                placeholder="000000"
                className={`w-full px-4 py-4 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none transition ${
                  otpError
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500'
                }`}
              />
              {otpError && (
                <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                  <AlertCircle size={16} />
                  {otpError}
                </div>
              )}
            </div>

            {/* Info: OTP expires */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Clock size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                This code expires in 10 minutes
              </p>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            {resendTimer > 0 ? (
              <p className="text-gray-600 text-sm">
                Resend code in <span className="font-semibold text-primary-500">{resendTimer}s</span>
              </p>
            ) : (
              <>
                <p className="text-gray-600 text-sm mb-2">Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isResending || resendTimer > 0}
                  className="text-primary-500 font-semibold hover:text-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? 'Resending...' : 'Resend Code'}
                </button>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm">
            <p className="text-gray-600 mb-3">
              Want to change email?
            </p>
            <Link
              to="/register-type"
              className="text-primary-500 font-semibold hover:text-primary-600"
            >
              Start over
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};