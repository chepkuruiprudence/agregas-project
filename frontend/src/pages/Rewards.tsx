import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useApi } from '../hooks/useApi';
import { useNotifications } from '../hooks/useNotifications';
import { Star, Leaf, Loader2, ShoppingBag } from 'lucide-react';

interface LoyaltyRecord {
  id: number;
  points: number;
  earned_at: string | null;
  redeemed_at: string | null;
  redemption_value: string | null;
  earned_from_order_id: number | null;
  redeemed_for_order_id: number | null;
}

interface CgcRecord {
  id: number;
  amount: string;
  earned_at: string | null;
  redeemed_at: string | null;
  redemption_amount: string | null;
  earned_from_order_id: number | null;
  redeemed_for_order_id: number | null;
}

const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

export const Rewards = () => {
  const { request } = useApi();
  const { addNotification } = useNotifications();

  const [pointsBalance, setPointsBalance] = useState(0);
  const [cgcBalance, setCgcBalance] = useState(0);
  const [loyaltyHistory, setLoyaltyHistory] = useState<LoyaltyRecord[]>([]);
  const [cgcHistory, setCgcHistory] = useState<CgcRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [redeeming, setRedeeming] = useState<'loyalty' | 'cgc' | null>(null);

  const fetchRewards = async () => {
    try {
      setFetching(true);
      // request() returns the body: { success, data, message }
      const [loyaltyBal, cgcBal, loyaltyHist, cgcHist] = await Promise.all([
        request('get', '/loyalty/balance/me'),
        request('get', '/cgc/balance/me'),
        request('get', '/loyalty/history/me'),
        request('get', '/cgc/history/me'),
      ]);

      setPointsBalance(typeof loyaltyBal?.data?.balance === 'number' ? loyaltyBal.data.balance : 0);
      setCgcBalance(typeof cgcBal?.data?.balance === 'number' ? cgcBal.data.balance : 0);
      setLoyaltyHistory(Array.isArray(loyaltyHist?.data) ? loyaltyHist.data : []);
      setCgcHistory(Array.isArray(cgcHist?.data) ? cgcHist.data : []);
    } catch {
      addNotification('Failed to load rewards', 'error');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchRewards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CGC redemption needs an order; loyalty redemption also needs one. The
  // backend applies rewards against a specific order, so redemption here
  // reserves the value toward the customer's NEXT order (id 0 placeholder is
  // not allowed) — instead we surface the balances and let checkout consume
  // them. To still let customers actively redeem, we redeem against their
  // most recent order.
  const handleRedeemLoyalty = async () => {
    if (loyaltyHistory.length === 0) {
      addNotification('Place an order first, then redeem points against it.', 'info');
      return;
    }
    if (!window.confirm(`Redeem all ${pointsBalance} points (worth KES ${pointsBalance.toLocaleString()})?`)) return;

    try {
      setRedeeming('loyalty');
      const latestOrderId =
        loyaltyHistory.find((r) => r.earned_from_order_id)?.earned_from_order_id ?? 0;
      await request('post', '/loyalty/redeem', {
        pointsToRedeem: pointsBalance,
        orderId: latestOrderId,
      });
      addNotification(`Redeemed ${pointsBalance} points!`, 'success');
      await fetchRewards();
    } catch (error: any) {
      addNotification(error.response?.data?.message || 'Failed to redeem points', 'error');
    } finally {
      setRedeeming(null);
    }
  };

  const handleRedeemCgc = async () => {
    if (cgcHistory.length === 0) {
      addNotification('Place an order first, then redeem CGCs against it.', 'info');
      return;
    }
    if (!window.confirm(`Redeem all ${cgcBalance} CGCs (worth KES ${cgcBalance.toLocaleString()})?`)) return;

    try {
      setRedeeming('cgc');
      const latestOrderId =
        cgcHistory.find((r) => r.earned_from_order_id)?.earned_from_order_id ?? 0;
      await request('post', '/cgc/redeem', {
        cgcAmount: cgcBalance,
        orderId: latestOrderId,
      });
      addNotification(`Redeemed ${cgcBalance} CGCs!`, 'success');
      await fetchRewards();
    } catch (error: any) {
      addNotification(error.response?.data?.message || 'Failed to redeem CGCs', 'error');
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="container-custom px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Rewards</h1>
          <p className="text-gray-600 mt-2">
            Earn 1 loyalty point and 1 CGC per kg of gas purchased. Both are worth KES 1 in discounts.
          </p>

          {fetching ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
          ) : (
            <>
              {/* Balance cards */}
              <div className="grid sm:grid-cols-2 gap-6 mt-8">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                      <Star size={20} className="text-teal-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Loyalty points</h2>
                  </div>
                  <p className="text-4xl font-extrabold text-gray-900 mt-4">
                    {pointsBalance.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Worth KES {pointsBalance.toLocaleString()} in discounts</p>
                  <button
                    onClick={handleRedeemLoyalty}
                    disabled={redeeming !== null || pointsBalance === 0}
                    className="mt-5 w-full px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {redeeming === 'loyalty' ? (
                      <Loader2 size={16} className="animate-spin mx-auto" />
                    ) : (
                      'Redeem points'
                    )}
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Leaf size={20} className="text-purple-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">CGC balance</h2>
                  </div>
                  <p className="text-4xl font-extrabold text-gray-900 mt-4">
                    {cgcBalance.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Carbon credits earned from your refills
                  </p>
                  <button
                    onClick={handleRedeemCgc}
                    disabled={redeeming !== null || cgcBalance === 0}
                    className="mt-5 w-full px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {redeeming === 'cgc' ? (
                      <Loader2 size={16} className="animate-spin mx-auto" />
                    ) : (
                      'Redeem CGCs'
                    )}
                  </button>
                </div>
              </div>

              {/* History */}
              <div className="grid lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="border-b border-gray-100 px-6 py-4">
                    <h3 className="font-bold text-gray-900">Loyalty history</h3>
                  </div>
                  {loyaltyHistory.length === 0 ? (
                    <div className="p-8 text-center">
                      <ShoppingBag size={36} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">Buy gas to start earning points.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {loyaltyHistory.map((r) => (
                        <li key={r.id} className="px-6 py-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {r.redeemed_at
                                ? `Redeemed for order #${r.redeemed_for_order_id}`
                                : `Earned from order #${r.earned_from_order_id}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {fmtDate(r.redeemed_at || r.earned_at)}
                            </p>
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              r.redeemed_at ? 'text-gray-400 line-through' : 'text-teal-600'
                            }`}
                          >
                            {r.points} pts
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="border-b border-gray-100 px-6 py-4">
                    <h3 className="font-bold text-gray-900">CGC history</h3>
                  </div>
                  {cgcHistory.length === 0 ? (
                    <div className="p-8 text-center">
                      <Leaf size={36} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">Refill gas to earn carbon credits.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {cgcHistory.map((r) => (
                        <li key={r.id} className="px-6 py-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {r.redeemed_at
                                ? `Redeemed for order #${r.redeemed_for_order_id}`
                                : `Earned from order #${r.earned_from_order_id}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {fmtDate(r.redeemed_at || r.earned_at)}
                            </p>
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              r.redeemed_at ? 'text-gray-400 line-through' : 'text-purple-600'
                            }`}
                          >
                            {Number(r.amount)} CGC
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};
