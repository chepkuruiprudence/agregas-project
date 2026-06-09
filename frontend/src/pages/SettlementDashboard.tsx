// frontend/src/pages/SettlementDashboard.tsx

import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const SettlementDashboard = () => {
  const { request } = useApi();
  const [settlement, setSettlement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettlement = async () => {
      try {
        // Get latest settlement cycle
        const response = await request('get', '/settlement/cycles?limit=1');
        setSettlement(response.data?.data);
      } catch (error) {
        console.error('Error fetching settlement:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettlement();
  }, [request]);

  if (loading) return <div>Loading settlement data...</div>;

  const cycle = settlement?.cycle;
  const obligations = settlement?.obligations || {};

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settlement Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor payment cycles and obligations</p>
      </div>

      {/* Current Cycle */}
      {cycle && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Net Value */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={24} className="text-blue-600" />
              <h3 className="font-semibold text-gray-700">Total Net Value</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              KES {parseInt(cycle.total_net_value || '0').toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">Cycle #{cycle.cycle_number}</p>
          </div>

          {/* Settled */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={24} className="text-green-600" />
              <h3 className="font-semibold text-gray-700">Settled</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{obligations.settled || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Obligations</p>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock size={24} className="text-amber-600" />
              <h3 className="font-semibold text-gray-700">Pending</h3>
            </div>
            <p className="text-3xl font-bold text-amber-600">{obligations.pending || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Awaiting execution</p>
          </div>

          {/* Failed */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className="text-red-600" />
              <h3 className="font-semibold text-gray-700">Failed</h3>
            </div>
            <p className="text-3xl font-bold text-red-600">{obligations.failed || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Requires attention</p>
          </div>
        </div>
      )}

      {/* Obligations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Settlement Obligations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {settlement?.summary?.map((ob: any, idx: number) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">Wallet {ob.fromWallet}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">Wallet {ob.toWallet}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    KES {ob.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        ob.status === 'settled'
                          ? 'bg-green-100 text-green-700'
                          : ob.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {ob.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};