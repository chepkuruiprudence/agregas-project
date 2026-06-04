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
 * PaymentPage - Receives order data from Orders page
 * Shows order summary and handles payment
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
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  /**
   * Calculate amounts from order data (NOT hardcoded)
   * 
   * finalPrice already includes:
   * - Base price
   * - Supply/demand adjustments
   * - Rebates
   * 
   * We add delivery fee on top
   */
  const parsePrice = (priceStr: string): number => {
    // Handle different formats: "1500", "1500.00", "KES 1500", etc.
    const cleaned = priceStr.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const subtotal = parsePrice(order.finalPrice);
  const deliveryFee = 150; // Standard delivery fee (could be dynamic based on location)
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
   * Handle payment
   */
  const handlePay = async () => {
    // ✅ Validate selected method
    if (selectedMethod === 'mpesa' && !mpesaPhone.trim()) {
      addNotification('Please enter your M-Pesa phone number', 'error');
      return;
    }
    if (selectedMethod === 'card' && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim())) {
      addNotification('Please fill in all card details', 'error');
      return;
    }

    setPaying(true);
    try {
      console.log('💳 Processing payment:', {
        orderId: order.id,
        method: selectedMethod,
        amount: total,
      });

      // ✅ Call backend payment endpoint
      await request('post', `/orders/${order.id}/pay`, {
        method: selectedMethod,
        phone: selectedMethod === 'mpesa' ? mpesaPhone : undefined,
        amount: total,
      });

      console.log('✅ Payment successful');
      setPaid(true);
      addNotification('Payment successful!', 'success');
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      const msg = error.response?.data?.message || 'Payment failed. Please try again.';
      addNotification(msg, 'error');
    } finally {
      setPaying(false);
    }
  };

  /**
   * Success state after payment
   */
  if (paid) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Payment Confirmed!</h2>
            <p className="text-gray-500 text-sm mt-2">
              Your order <span className="font-semibold text-gray-700">#{order.id}</span> has been
              paid. We'll start processing it right away.
            </p>
            <div className="mt-6 bg-gray-50 rounded-xl px-5 py-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order</span>
                <span className="font-medium text-gray-800">
                  {order.brand} {order.cylinderSize} ×{order.quantity}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-semibold text-green-600">KES {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Method</span>
                <span className="font-medium text-gray-800 capitalize">{selectedMethod}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="mt-6 w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Back to Orders
            </button>
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

              {/* Method selector */}
              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 transition-all text-left ${
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
                        className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
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
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
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
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 tracking-widest"
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
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
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
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
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

              {/* Pay button */}
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
                🔒 Payments are secure and encrypted
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
                  {/* Order details - comes from order prop */}
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

                  {/* Price breakdown - calculated from order data */}
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

                  {/* Total - calculated, NOT hardcoded */}
                  <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Total</span>
                    <span className="text-lg font-bold text-violet-600">
                      KES {total.toLocaleString()}
                    </span>
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