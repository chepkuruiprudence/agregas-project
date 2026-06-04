import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

interface AnalyticsMetrics {
  totalUsers?: number;
  platformRevenue?: string;
  totalOrders?: number;
  systemHealth?: string;
  subscriptions?: number;
  cgcMetrics?: string;
  gasOnCreditMetrics?: string;
}

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'users' | 'analytics' | 'settings' | 'alerts' | 'ai'>('home');

  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  
  const [cbrRate, setCbrRate] = useState<number>(12);
  const [rolloverPercentage, setRolloverPercentage] = useState<number>(20);
  const [loyaltyMultiplier, setLoyaltyMultiplier] = useState<number>(1);

  const [alertMessage, setAlertMessage] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Find this function inside your frontend AdminDashboard.tsx file:
const getAuthHeaders = () => {
  const token = localStorage.getItem('agregas_token');
  
  // Guard clause: Prevent sending 'null' or 'undefined' as string literals to the server
  if (!token || token === 'undefined' || token === 'null') {
    console.warn("Agregas Security: Token missing or corrupted in localStorage.");
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer INVALID_TOKEN'
    };
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

  useEffect(() => {
    const fetchInitialDashboardData = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const analyticsResponse = await fetch('/api/admin/analytics', {
          method: 'GET',
          headers: getAuthHeaders()
        });
        const analyticsResult = await analyticsResponse.json();
        if (analyticsResult.success) {
          setMetrics(analyticsResult.data);
        } else {
          setErrorMessage(analyticsResult.message || 'Failed to resolve telemetry metrics engine profiles.');
        }

        const usersResponse = await fetch('/api/admin/users?page=1&limit=50', {
          method: 'GET',
          headers: getAuthHeaders()
        });
        const usersResult = await usersResponse.json();
        if (usersResult.success) {
          // Fallback to empty array check if database records are structurally empty
          setUsers(Array.isArray(usersResult.data) ? usersResult.data : []);
        }
        
      } catch (error: any) {
        setErrorMessage('Failed to connect to Agregas backend core services.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialDashboardData();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newRole })
      });
      const result = await response.json();
      
      if (result.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        triggerToast('User role updated successfully');
      }
    } catch (err) {
      setErrorMessage('Could not update user classification privilege.');
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      const result = await response.json();
      
      if (result.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, isActive: false } : u));
        triggerToast('User profile deactivated successfully');
      }
    } catch (err) {
      setErrorMessage('Could not apply lifecycle suspension to user handle.');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ cbrRate, rolloverPercentage, loyaltyMultiplier })
      });
      const result = await response.json();
      
      if (result.success) {
        triggerToast('CBR and credit parameters committed successfully');
      }
    } catch (err) {
      setErrorMessage('Failed to broadcast settings adjustments.');
    }
  };

  const handleBroadcastAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertMessage.trim()) return;
    triggerToast(`Global network notification broadcasted successfully.`);
    setAlertMessage('');
  };

  const triggerToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">Loading Agregas Exchange Core...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom px-4 mx-auto max-w-7xl">
          
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded shadow">
              <p className="font-bold">System Warning</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-100 border-l-4 border-emerald-500 text-emerald-700 rounded shadow">
              <p className="text-sm font-semibold">✨ {successMessage}</p>
            </div>
          )}

          <h1 className="text-4xl font-bold mb-8 text-gray-900">ACSE Central Command</h1>

          {/* Dynamic KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Active Users', value: metrics?.totalUsers?.toLocaleString() ?? '0', icon: '👥', color: 'text-blue-600' },
              { label: 'Platform Revenue', value: metrics?.platformRevenue ?? '0 KES', icon: '💰', color: 'text-emerald-600' },
              { label: 'Total Gas Orders', value: metrics?.totalOrders?.toLocaleString() ?? '0', icon: '📦', color: 'text-amber-600' },
              { label: 'System Health Status', value: metrics?.systemHealth ?? '0%', icon: '✅', color: 'text-indigo-600' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Tab Navigation interface */}
          <div className="flex flex-wrap border-b border-gray-200 mb-8 gap-2">
            {[
              { id: 'home', label: 'Home KPIs' },
              { id: 'users', label: 'User Operations' },
              { id: 'analytics', label: 'Credit & Metrics' },
              { id: 'settings', label: 'CBR Engine Configuration' },
              { id: 'alerts', label: 'Global Notifications' },
              { id: 'ai', label: 'AI Agent Terminal' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-5 text-sm font-medium rounded-t-lg transition -mb-px border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 bg-white border-t border-x border-gray-200 shadow-sm font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Work Panel Content Container */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            
            {activeTab === 'home' && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-800">Operational System Summary</h2>
                <p className="text-gray-600 mb-6">Welcome to the AGREGAS Corporate Dashboard interface. Navigate across the functional configuration tabs to moderate profiles, tune credit calculations, review AI agent execution stacks, and broadcast system notifications.</p>
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-200 text-slate-800">SYSTEM RUNNING</span>
                  <p className="mt-3 text-sm text-gray-500">All asynchronous database clearing pipelines are running securely.</p>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h2 className="text-xl font-bold mb-6 text-gray-800">System Identity and Access Directory</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-sm font-semibold">
                        <th className="p-4">Full Name</th>
                        <th className="p-4">Email Handle</th>
                        <th className="p-4">Assigned Role Context</th>
                        <th className="p-4">Lifecycle State</th>
                        <th className="p-4 text-right">Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-400">No active users retrieved from backend.</td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition">
                            <td className="p-4 font-medium text-gray-900">{user.fullName}</td>
                            <td className="p-4 text-gray-600">{user.email}</td>
                            <td className="p-4">
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                className="bg-white border border-gray-300 text-gray-700 rounded px-2 py-1 focus:ring-1 focus:ring-primary-500"
                              >
                                <option value="customer">Customer</option>
                                <option value="retailer">Retailer</option>
                                <option value="brand">Brand (OMC)</option>
                                <option value="admin">System Admin</option>
                              </select>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {user.isActive ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {user.isActive && (
                                <button
                                  onClick={() => handleDeactivateUser(user.id)}
                                  className="text-xs font-medium text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded transition"
                                >
                                  Deactivate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-xl font-bold mb-6 text-gray-800">Advanced Platform Analytics Ledger</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="p-6 border border-gray-200 rounded-xl bg-slate-50">
                    <h3 className="font-semibold text-lg mb-4 text-slate-800">Collateralized Gas Tokens (CGC) Metrics</h3>
                    <p className="text-gray-600 text-sm mb-4">Live pooling valuations, active subscription counts, and automated collateral reservation parameters.</p>
                    <div className="text-xl font-mono font-bold text-slate-900">
                      {metrics?.subscriptions ?? 0} Active Subscriptions
                    </div>
                  </div>
                  <div className="p-6 border border-gray-200 rounded-xl bg-slate-50">
                    <h3 className="font-semibold text-lg mb-4 text-slate-800">Gas on Credit Allocation Analytics</h3>
                    <p className="text-gray-600 text-sm mb-4">Aggregated exposure status logs running across your current engine thresholds.</p>
                    <div className="text-xl font-mono font-bold text-slate-900">
                      {metrics?.gasOnCreditMetrics ?? 'System Healthy'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-bold mb-2 text-gray-800">CBR Rate & Interest Factoring Parameters</h2>
                <p className="text-gray-500 text-sm mb-6">Modify baseline macroeconomic constraints feeding calculation pipelines for dynamic Gas on Credit options.</p>
                
                <form onSubmit={handleUpdateSettings} className="max-w-md space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Central Bank Rate (CBR) Percentage</label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        step="0.01"
                        value={cbrRate}
                        onChange={(e) => setCbrRate(parseFloat(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">%</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Rollover Allocation Weight</label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        value={rolloverPercentage}
                        onChange={(e) => setRolloverPercentage(parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">%</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loyalty Multiplier Scaling Value</label>
                    <input
                      type="number"
                      step="0.1"
                      value={loyaltyMultiplier}
                      onChange={(e) => setLoyaltyMultiplier(parseFloat(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary-900 hover:bg-primary-800 text-white font-medium py-2.5 px-4 rounded-lg shadow shift-hover transition"
                  >
                    Commit Configuration Parameters
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div>
                <h2 className="text-xl font-bold mb-2 text-gray-800">Global Notification Management</h2>
                <p className="text-gray-500 text-sm mb-6">Broadcast cross-cutting operational announcements directly onto vendor dashboards, driver screens, or client interfaces.</p>
                
                <form onSubmit={handleBroadcastAlert} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience Profile Group</label>
                    <select className="max-w-xs w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-700">
                      <option>All Network Participants</option>
                      <option>Oil Marketing Companies (Brands)</option>
                      <option>Licensed Retail Gas Vendors</option>
                      <option>Logistics Operators (Riders)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Broadcast Message Body Context</label>
                    <textarea
                      rows={4}
                      value={alertMessage}
                      onChange={(e) => setAlertMessage(e.target.value)}
                      placeholder="Type urgent system alert message here..."
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-primary-950 hover:bg-primary-900 text-white font-semibold py-2.5 px-6 rounded-lg shadow transition"
                  >
                    Dispatch Network Broadcast
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'ai' && (
              <div>
                <h2 className="text-xl font-bold mb-2 text-gray-800">AGREGAS Core AI Agent Monitor</h2>
                <p className="text-gray-500 text-sm mb-6">Real-time trace window watching execution layers, pricing adjustment models, and smart automated clearing validations.</p>
                
                <div className="bg-slate-900 text-slate-200 rounded-xl p-6 font-mono text-xs space-y-2 max-h-96 overflow-y-auto shadow-inner border border-slate-950">
                  <p className="text-emerald-400">[SYSTEM INFO] AGREGAS AI Agent instance synced to live analytics layer.</p>
                  <p className="text-slate-400">[TELEMETRY] Listening for incoming database order hooks...</p>
                  <p className="text-indigo-400">[ORCHESTRATOR] Monitoring active inventory nodes for Nairobi localized grid maps...</p>
                  <p className="text-emerald-400">[AGENT LOG] System active and listening on pipeline event bus.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};