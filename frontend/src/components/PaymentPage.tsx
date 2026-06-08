import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useApi } from '../hooks/useApi';
import { useNotifications } from '../hooks/useNotifications';
import {
  CheckCircle,
  Phone,
  CreditCard,
  Banknote,
  ChevronLeft,
  Package,
  MapPin,
  Flame,
  Loader2,
  AlertCircle,
  TrendingUp,
  Wallet,
} from 'lucide-react';

type PaymentMethod = 'mpesa' | 'card' | 'cash';

interface OrderData {
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
  latitude?: string;
  longitude?: string;
}

interface LocationState {
  order: OrderData;
}

interface PaymentResponse {
  success: boolean;
  transactionId: string;
  orderId: number;
  amount: number;
  paymentMethod: string;
  walletBalances: {
    customer: number;
    retailer: number;
    omc: number;
    agregas: number;
  };
  ledgerEntriesCreated: number;
  nextSteps: string;
}

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'mpesa',
    label: 'M-Pesa',
    description: 'Pay via STK Push to your phone',
    icon: <Phone size={18} />,
  },
  {
    id: 'card',
    label: 'Card',
    description: 'Visa, Mastercard accepted',
    icon: <CreditCard size={18} />,
  },
  {
    id: 'cash',
    label: 'Cash on Delivery',
    description: 'Pay when your gas arrives',
    icon: <Banknote size={18} />,
  },
];

/**
 * PaymentPage - ACSE Integrated
 * 
 * Flow:
 * 1. User selects payment method & fills details
 * 2. Clicks "Pay"
 * 3. Calls POST /api/payments/process
 * 4. Backend creates ledger entries (instant)
 * 5. Displays wallet balances & next steps
 * 6. Shows success screen
 */
export const PaymentPage = () => {
  const { state } = useLocation() as { state: LocationState };
  const navigate = useNavigate();
  const { request } = useApi();
  const { addNotification } = useNotifications();

  const order = state?.order;

  // ❌ If no order data, redirect
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No order data found.</p>
          <button
            onClick={() => navigate('/orders')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  
  // 🆕 Payment states
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  /**
   * Calculate amounts from order data
   * finalPrice already includes: base price + supply/demand + rebates
   * We add delivery fee on top
   */
  const parsePrice = (priceStr: string): number => {
    const cleaned = priceStr.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const subtotal = parsePrice(order.finalPrice);
  const deliveryFee = 150; // KES
  const total = subtotal + deliveryFee;

  console.log('💰 Payment Summary:', {
    orderPrice: order.finalPrice,
    subtotal,
    deliveryFee,
    total,
  });

  const formatCardNumber = (val: string) =>
    val
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(.{4})/g, '$1 ')
      .trim();

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  /**
   * 🆕 MAIN: Process payment with ACSE backend
   * Calls: POST /api/payments/process
   */
  const handlePay = async () => {
    // ✅ Validate selected method
    if (selectedMethod === 'mpesa' && !mpesaPhone.trim()) {
      addNotification('Please enter your M-Pesa phone number', 'error');
      return;
    }
    if (
      selectedMethod === 'card' &&
      (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim())
    ) {
      addNotification('Please fill in all card details', 'error');
      return;
    }

    setPaying(true);
    setPaymentError(null);

    try {
      console.log('💳 Initiating payment with backend:', {
        orderId: order.id,
        method: selectedMethod,
        amount: total,
      });

      // 🆕 Generate idempotency key (prevents double charges)
      const idempotencyKey = `order-${order.id}-${Date.now()}`;

      // 🆕 Call ACSE payment endpoint
      const response = await request('post', '/payments/process', {
        orderId: order.id,
        amount: total,
        paymentMethod: selectedMethod,
        phoneNumber: selectedMethod === 'mpesa' ? mpesaPhone : undefined,
        idempotencyKey,
      });

      console.log('✅ Payment response from backend:', response.data);

      if (response.data?.success) {
        // 🆕 Store response for display
        setPaymentResponse(response.data.data);
        setPaid(true);

        // 🆕 Show success notification with wallet info
        addNotification(
          `Payment processed! Ledger updated with ${response.data.data.ledgerEntriesCreated} entries`,
          'success'
        );

        console.log('💰 Wallet balances:', response.data.data.walletBalances);
      } else {
        throw new Error(response.data?.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Payment failed. Please try again.';
      
      setPaymentError(errorMsg);
      addNotification(errorMsg, 'error');
    } finally {
      setPaying(false);
    }
  };

  /**
   * 🆕 Success state after payment
   * Shows:
   * - Transaction ID
   * - Wallet balances
   * - Next steps based on payment method
   */
  if (paid && paymentResponse) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 flex items-center justify-center px-4 py-16">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-10 max-w-2xl w-full">
            {/* Success Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <CheckCircle size={32} className="text-green-600" />
            </div>

            {/* Main Message */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Payment Confirmed!
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Your order <span className="font-semibold text-gray-800">#{order.id}</span> has been
              paid successfully. The ledger has been updated.
            </p>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-mono text-sm font-semibold text-gray-900 break-all">
                  {paymentResponse.transactionId}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-500">Order</span>
                  <span className="font-medium text-gray-800">
                    {order.brand} {order.cylinderSize} ×{order.quantity}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-800">KES {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-500">Delivery fee</span>
                  <span className="text-gray-800">KES {deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-700">Total Paid</span>
                  <span className="text-green-600">KES {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-medium text-gray-800 capitalize">
                    {paymentResponse.paymentMethod}
                  </span>
                </div>
              </div>
            </div>

            {/* 🆕 Wallet Balances (ACSE) */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Wallet size={18} className="text-blue-600" />
                <h3 className="font-semibold text-blue-900">Ledger Snapshot</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Ledger entries created:</span>
                  <span className="font-semibold text-blue-900">
                    {paymentResponse.ledgerEntriesCreated} entries
                  </span>
                </div>
                
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <p className="text-xs text-blue-600 mb-2">Wallet balances (after payment):</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white rounded p-2">
                      <div className="text-blue-600">Customer</div>
                      <div className="font-semibold text-gray-900">
                        {paymentResponse.walletBalances.customer > 0 ? '+' : ''}
                        {paymentResponse.walletBalances.customer.toLocaleString()} KES
                      </div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-blue-600">Retailer</div>
                      <div className="font-semibold text-gray-900">
                        +{paymentResponse.walletBalances.retailer.toLocaleString()} KES
                      </div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-blue-600">OMC</div>
                      <div className="font-semibold text-gray-900">
                        +{paymentResponse.walletBalances.omc.toLocaleString()} KES
                      </div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-blue-600">AGREGAS</div>
                      <div className="font-semibold text-gray-900">
                        +{paymentResponse.walletBalances.agregas.toLocaleString()} KES
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-blue-600 mt-3 italic">
                  💡 Wallet balances are derived from the ledger. Money will be distributed during the settlement cycle.
                </p>
              </div>
            </div>

            {/* 🆕 Next Steps (ACSE) */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-amber-600" />
                <h3 className="font-semibold text-amber-900">What happens next?</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                {paymentResponse.paymentMethod === 'mpesa' && (
                  <>
                    <div className="flex gap-3">
                      <div className="text-amber-600 font-bold">1.</div>
                      <div>
                        <div className="font-semibold text-gray-900">STK Prompt Sent</div>
                        <div className="text-gray-600">
                          An STK prompt has been sent to {mpesaPhone}. Enter your M-Pesa PIN to confirm payment.
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="text-amber-600 font-bold">2.</div>
                      <div>
                        <div className="font-semibold text-gray-900">Confirmation</div>
                        <div className="text-gray-600">
                          Once you enter your PIN, we'll receive confirmation from M-Pesa. Your order will move to "Confirmed" status.
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="text-amber-600 font-bold">3.</div>
                      <div>
                        <div className="font-semibold text-gray-900">Settlement</div>
                        <div className="text-gray-600">
                          At the end of each day, we'll process settlement. Retailer and OMC will receive their portions.
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {paymentResponse.paymentMethod === 'card' && (
                  <>
                    <div className="flex gap-3">
                      <div className="text-amber-600 font-bold">1.</div>
                      <div>
                        <div className="font-semibold text-gray-900">Gateway Processing</div>
                        <div className="text-gray-600">
                          Your card details are being processed through a secure payment gateway.
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="text-amber-600 font-bold">2.</div>
                      <div>
                        <div className="font-semibold text-gray-900">3D Secure (if needed)</div>
                        <div className="text-gray-600">
                          Your bank may require 3D Secure authentication. You'll be redirected shortly.
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="text-amber-600 font-bold">3.</div>
                      <div>
                        <div className="font-semibold text-gray-900">Order Confirmed</div>
                        <div className="text-gray-600">
                          Once confirmed, your retailer will prepare your order for delivery.
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {paymentResponse.paymentMethod === 'cash' && (
                  <>
                    <div className="flex gap-3">
                      <div className="text-amber-600 font-bold">1.</div>
                      <div>
                        <div className="font-semibold text-gray-900">Awaiting Confirmation</div>
                        <div className="text-gray-600">
                          Your retailer has been notified. They'll call you to confirm delivery timing.
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="text-amber-600 font-bold">2.</div>
                      <div>
                        <div className="font-semibold text-gray-900">Delivery</div>
                        <div className="text-gray-600">
                          Have KES {total.toLocaleString()} ready. Exact change is appreciated.
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="text-amber-600 font-bold">3.</div>
                      <div>
                        <div className="font-semibold text-gray-900">Receipt</div>
                        <div className="text-gray-600">
                          Get a receipt from your retailer as proof of payment.
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/orders')}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
              >
                Back to Orders
              </button>
              <button
                onClick={() => navigate('/dashboard/customer')}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  /**
   * Main payment page
   */
  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
          >
            <ChevronLeft size={16} />
            Back to Orders
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
            {/* ── LEFT: Payment Form ─────────────────────────────────── */}
            <div className="sm:col-span-3 space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Choose how you'd like to pay for order #{order.id}
                </p>
              </div>

              {/* 🆕 Error display */}
              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 flex gap-3">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Payment Error</p>
                    <p className="text-xs text-red-700 mt-0.5">{paymentError}</p>
                  </div>
                </div>
              )}

              {/* Method selector */}
              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    disabled={paying}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 transition-all text-left disabled:opacity-50 ${
                      selectedMethod === method.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selectedMethod === method.id
                          ? 'bg-violet-100 text-violet-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          selectedMethod === method.id ? 'text-violet-700' : 'text-gray-800'
                        }`}
                      >
                        {method.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{method.description}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        selectedMethod === method.id
                          ? 'border-violet-500 bg-violet-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedMethod === method.id && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Dynamic form fields */}
              {selectedMethod === 'mpesa' && (
                <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">M-Pesa Details</h3>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                        +254
                      </span>
                      <input
                        type="tel"
                        placeholder="7XX XXX XXX"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        disabled={paying}
                        className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 disabled:opacity-50"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      An STK Push will be sent to this number to confirm payment.
                    </p>
                  </div>
                </div>
              )}

              {selectedMethod === 'card' && (
                <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">Card Details</h3>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1.5">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      disabled={paying}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1.5">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      disabled={paying}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 disabled:opacity-50 tracking-widest"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 font-medium mb-1.5">
                        Expiry
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        disabled={paying}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 font-medium mb-1.5">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        disabled={paying}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'cash' && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5">
                  <p className="text-sm text-amber-700 font-medium">Pay on Delivery</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Have <span className="font-semibold">KES {total.toLocaleString()}</span> ready
                    when your gas is delivered. Exact change is appreciated.
                  </p>
                </div>
              )}

              {/* 🆕 Pay button (now calls backend) */}
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
              >
                {paying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    Pay KES {total.toLocaleString()}
                    <ChevronLeft size={16} className="rotate-180" />
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-gray-400">
                🔒 Payments are secure and encrypted. Ledger entries created instantly.
              </p>
            </div>

            {/* ── RIGHT: Order Summary ───────────────────────────────── */}
            <div className="sm:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Flame size={14} className="text-violet-500" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-800">Order Summary</h2>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {/* Order details */}
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2">
                      <Package size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {order.brand} {order.cylinderSize}
                        </p>
                        <p className="text-xs text-gray-400">Qty: {order.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-500">{order.deliveryAddress}</p>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="border-t border-gray-50 pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-700">KES {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Delivery fee</span>
                      <span className="text-gray-700">KES {deliveryFee.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Total</span>
                    <span className="text-lg font-bold text-violet-600">
                      KES {total.toLocaleString()}
                    </span>
                  </div>

                  {/* 🆕 ACSE Info Box */}
                  <div className="bg-blue-50 rounded-xl px-4 py-3 text-[11px] text-blue-700 space-y-1">
                    <div className="font-semibold">💡 ACSE System</div>
                    <div>
                      Payment will create ledger entries instantly. Settlement happens later.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};