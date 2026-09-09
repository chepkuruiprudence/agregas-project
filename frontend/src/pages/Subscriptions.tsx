import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useApi } from '../hooks/useApi';
import { useNotifications } from '../hooks/useNotifications';
import { CheckCircle, Clock, TrendingUp, CreditCard, Loader2, RefreshCw, XCircle } from 'lucide-react';

interface Subscription {
  id: number;
  tier: 'basic' | 'standard' | 'premium';
  deposit_amount: string;
  current_balance: string;
  rollover_percentage: number;
  rollover_amount: string;
  expiry_date: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  created_at: string;
}

const TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    deposit: 500,
    perks: ['KES 500 monthly gas credit', '20% balance rollover', 'Standard delivery'],
  },
  {
    id: 'standard',
    name: 'Standard',
    deposit: 1000,
    perks: ['KES 1,000 monthly gas credit', '20% balance rollover', 'Priority delivery'],
  },
  {
    id: 'premium',
    name: 'Premium',
    deposit: 2000,
    perks: ['KES 2,000 monthly gas credit', '20% balance rollover', 'Priority delivery', 'Dedicated support'],
  },
];

const statusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    expired: 'bg-gray-200 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const daysLeft = (expiryDate: string) => {
  const ms = new Date(expiryDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

export const Subscriptions = () => {
  const { request, loading } = useApi();
  const { addNotification } = useNotifications();

  const [subs, setSubs] = useState<Subscription[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionBusy, setActionBusy] = useState<number | null>(null);

  const fetchSubs = async () => {
    try {
      setFetching(true);
      const response = await request('get', '/subscriptions/mine');
      setSubs(Array.isArray(response?.data) ? response.data : []);
    } catch {
      addNotification('Failed to load subscriptions', 'error');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubscribe = async (tier: string) => {
    const tierConfig = TIERS.find((t) => t.id === tier);
    if (!tierConfig) return;
    if (!window.confirm(`Subscribe to the ${tierConfig.name} plan with a KES ${tierConfig.deposit.toLocaleString()} deposit?`)) return;

    try {
      setActionBusy(-1);
      await request('post', '/subscriptions/create', {
        tier,
        depositAmount: tierConfig.deposit,
      });
      addNotification(`Subscribed to the ${tierConfig.name} plan!`, 'success');
      await fetchSubs();
    } catch (error: any) {
      addNotification(error.response?.data?.message || 'Failed to subscribe', 'error');
    } finally {
      setActionBusy(null);
    }
  };

  const handleRenew = async (sub: Subscription) => {
    try {
      setActionBusy(sub.id);
      await request('put', `/subscriptions/${sub.id}/renew`);
      addNotification('Subscription renewed!', 'success');
      await fetchSubs();
    } catch (error: any) {
      addNotification(error.response?.data?.message || 'Failed to renew', 'error');
    } finally {
      setActionBusy(null);
    }
  };

  const handleCancel = async (sub: Subscription) => {
    if (!window.confirm('Cancel this subscription? Remaining balance policies apply.')) return;
    try {
      setActionBusy(sub.id);
      await request('put', `/subscriptions/${sub.id}/cancel`);
      addNotification('Subscription cancelled', 'success');
      await fetchSubs();
    } catch (error: any) {
      addNotification(error.response?.data?.message || 'Failed to cancel', 'error');
    } finally {
      setActionBusy(null);
    }
  };

  const hasActive = subs.some((s) => s.status === 'active');
  const busy = loading || fetching;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="container-custom px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-gray-600 mt-2">
              Get monthly gas credit with a deposit — balance rolls over, delivery prioritized.
            </p>
          </div>

          {/* Current subscriptions */}
          <div className="mt-8 space-y-4">
            {busy ? (
              <div className="flex justify-center py-12">
                <Loader2 size={32} className="animate-spin text-primary-500" />
              </div>
            ) : subs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <CreditCard size={44} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600">No subscriptions yet — pick a plan below to get started.</p>
              </div>
            ) : (
              subs.map((sub) => (
                <div key={sub.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900 capitalize">{sub.tier} plan</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(sub.status)}`}>
                          {sub.status}
                        </span>
                      </div>
                      {sub.status === 'active' && (
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                          <Clock size={14} />
                          {daysLeft(sub.expiry_date)} days remaining
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {sub.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleRenew(sub)}
                            disabled={actionBusy === sub.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                          >
                            {actionBusy === sub.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            Renew
                          </button>
                          <button
                            onClick={() => handleCancel(sub)}
                            disabled={actionBusy === sub.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold rounded-lg transition disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-gray-500">Deposit</p>
                      <p className="font-bold text-gray-900">KES {Number(sub.deposit_amount).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-gray-500">Balance left</p>
                      <p className="font-bold text-gray-900">KES {Number(sub.current_balance).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-gray-500">Rollover</p>
                      <p className="font-bold text-gray-900">{sub.rollover_percentage}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-gray-500">Rollover amount</p>
                      <p className="font-bold text-gray-900">KES {Number(sub.rollover_amount).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Available plans */}
          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">
            {hasActive ? 'Switch plans' : 'Choose a plan'}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <div key={tier.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                <p className="text-3xl font-extrabold text-primary-600 mt-2">
                  KES {tier.deposit.toLocaleString()}
                  <span className="text-sm font-medium text-gray-400"> /month</span>
                </p>
                <ul className="mt-4 space-y-2 flex-1">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={busy || actionBusy === -1}
                  className="mt-6 w-full px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition disabled:opacity-50"
                >
                  {actionBusy === -1 ? 'Subscribing…' : 'Subscribe'}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-3">
            <TrendingUp size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Your deposit becomes spendable gas credit. When the month ends, 20% of any unused
              balance rolls over to your next cycle.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};
