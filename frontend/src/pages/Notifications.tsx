import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useApi } from '../hooks/useApi';
import { useNotifications } from '../hooks/useNotifications';
import {
  Bell,
  Loader2,
  CheckCheck,
  Package,
  AlertCircle,
  Wallet,
  Star,
  Megaphone,
  CalendarClock,
  Leaf,
  Zap,
} from 'lucide-react';

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  related_order_id: number | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_META: Record<string, { icon: typeof Bell; color: string }> = {
  order_update: { icon: Package, color: 'bg-blue-100 text-blue-600' },
  payment_due: { icon: AlertCircle, color: 'bg-red-100 text-red-600' },
  price_alert: { icon: Wallet, color: 'bg-amber-100 text-amber-600' },
  subscription_reminder: { icon: CalendarClock, color: 'bg-orange-100 text-orange-600' },
  loyalty_earned: { icon: Star, color: 'bg-teal-100 text-teal-600' },
  cgc_earned: { icon: Leaf, color: 'bg-purple-100 text-purple-600' },
  system_alert: { icon: Megaphone, color: 'bg-gray-200 text-gray-600' },
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const Notifications = () => {
  const navigate = useNavigate();
  const { request } = useApi();
  const { addNotification } = useNotifications();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = async () => {
    try {
      setFetching(true);
      // request() returns the body: { success, data: Notification[] }
      const res = await request('get', '/notifications/me?limit=50');
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch {
      addNotification('Failed to load notifications', 'error');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkAllRead = async () => {
    const unread = items.filter((n) => !n.is_read);
    if (unread.length === 0) return;

    try {
      setMarking(true);
      await Promise.all(
        unread.map((n) => request('put', `/notifications/${n.id}/read`))
      );
      addNotification('All notifications marked as read', 'success');
      await fetchNotifications();
    } catch {
      addNotification('Failed to update notifications', 'error');
    } finally {
      setMarking(false);
    }
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="container-custom px-4 max-w-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-2">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                  : 'You are all caught up.'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={marking}
                className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-full transition disabled:opacity-50"
              >
                {marking ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCheck size={16} />
                )}
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-8 space-y-3">
            {fetching ? (
              <div className="flex justify-center py-16">
                <Loader2 size={32} className="animate-spin text-primary-500" />
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-semibold">No notifications yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Order updates, payment alerts, and rewards will appear here.
                </p>
                <button
                  onClick={() => navigate('/orders')}
                  className="mt-6 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition"
                >
                  Place your first order
                </button>
              </div>
            ) : (
              items.map((n) => {
                const meta = TYPE_META[n.type] || TYPE_META.system_alert;
                const Icon = meta.icon;
                return (
                  <div
                    key={n.id}
                    className={`bg-white rounded-2xl border p-5 flex gap-4 transition ${
                      n.is_read
                        ? 'border-gray-100 opacity-75'
                        : 'border-primary-200 shadow-sm'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-gray-900">
                          {n.title}
                          {!n.is_read && (
                            <span className="ml-2 inline-block w-2 h-2 rounded-full bg-primary-500 align-middle" />
                          )}
                        </p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {fmtDate(n.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                      {n.related_order_id && (
                        <button
                          onClick={() => navigate('/orders')}
                          className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-semibold"
                        >
                          View order #{n.related_order_id} →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};
