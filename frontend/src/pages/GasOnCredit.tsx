import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useApi } from '../hooks/useApi';
import { useNotifications } from '../hooks/useNotifications';
import { Zap, Loader2, ShieldCheck, CheckCircle2, XCircle, CalendarDays } from 'lucide-react';

interface Loan {
  id: number;
  amount: string;
  interest_rate: string;
  status: string;
  repayment_balance: string;
  repayment_schedule: Array<{
    month: number;
    amount: number;
    dueDate: string;
    paid: boolean;
  }> | null;
  created_at: string;
}

interface Eligibility {
  eligible: boolean;
  reason?: string;
  maxAmount?: number;
  interestRate?: number;
}

export const GasOnCredit = () => {
  const { request } = useApi();
  const { addNotification } = useNotifications();

  const [balance, setBalance] = useState<{ totalOwed: number; activeLoans: number } | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [fetching, setFetching] = useState(true);
  const [applying, setApplying] = useState(false);
  const [repaying, setRepaying] = useState<number | null>(null);

  const fetchCredit = async () => {
    try {
      setFetching(true);
      // request() returns the body: { success, data }
      const [balRes, eligRes, loansRes] = await Promise.all([
        request('get', '/gas-credit/balance/me'),
        request('post', '/gas-credit/check-eligibility'),
        request('get', '/gas-credit/loans/mine'),
      ]);

      setBalance(
        balRes?.data
          ? { totalOwed: Number(balRes.data.totalOwed) || 0, activeLoans: balRes.data.activeLoans ?? 0 }
          : { totalOwed: 0, activeLoans: 0 }
      );
      setEligibility(eligRes?.data ?? null);
      setLoans(Array.isArray(loansRes?.data) ? loansRes.data : []);
    } catch {
      addNotification('Failed to load gas credit info', 'error');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchCredit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = async () => {
    const max = eligibility?.maxAmount ?? 2000;
    const input = window.prompt(
      `Apply for gas credit.\nYou may qualify for up to KES ${max.toLocaleString()} at ${eligibility?.interestRate ?? 5}% interest.\nEnter loan amount:`,
      String(Math.min(1000, max))
    );
    if (!input) return;
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) {
      addNotification('Please enter a valid amount', 'error');
      return;
    }

    try {
      setApplying(true);
      const res = await request('post', '/gas-credit/apply', { loanAmount: amount });
      addNotification(
        `Approved! Loan of KES ${amount.toLocaleString()} with a ${res?.data?.repaymentSchedule?.length ?? 3}-month repayment plan.`,
        'success'
      );
      await fetchCredit();
    } catch (error: any) {
      addNotification(error.response?.data?.message || 'Credit application failed', 'error');
    } finally {
      setApplying(false);
    }
  };

  const handleRepay = async (loan: Loan) => {
    const owed = Number(loan.repayment_balance);
    const input = window.prompt(
      `Repay loan #${loan.id}.\nOutstanding balance: KES ${owed.toLocaleString()}\nEnter amount to pay:`,
      String(owed)
    );
    if (!input) return;
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) {
      addNotification('Please enter a valid amount', 'error');
      return;
    }

    try {
      setRepaying(loan.id);
      await request('post', '/gas-credit/repay', { loanId: loan.id, amountPaid: amount });
      addNotification(`Repaid KES ${amount.toLocaleString()} on loan #${loan.id}`, 'success');
      await fetchCredit();
    } catch (error: any) {
      addNotification(error.response?.data?.message || 'Repayment failed', 'error');
    } finally {
      setRepaying(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="container-custom px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Gas on Credit</h1>
          <p className="text-gray-600 mt-2 max-w-2xl">
            Reliable customers can get gas now and pay later. Eligibility: 3+ orders in the last
            45 days, a CGC balance of 100+, and no prior defaults.
          </p>

          {fetching ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid sm:grid-cols-2 gap-6 mt-8">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Zap size={20} className="text-amber-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Outstanding balance</h2>
                  </div>
                  <p className="text-4xl font-extrabold text-gray-900 mt-4">
                    KES {(balance?.totalOwed ?? 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Across {balance?.activeLoans ?? 0} active loan{(balance?.activeLoans ?? 0) === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <ShieldCheck size={20} className="text-green-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Eligibility</h2>
                  </div>
                  {eligibility?.eligible ? (
                    <>
                      <p className="mt-4 flex items-center gap-2 text-green-700 font-semibold">
                        <CheckCircle2 size={18} /> You qualify for credit
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {eligibility.reason || `Up to KES ${(eligibility.maxAmount ?? 0).toLocaleString()}`}
                      </p>
                      <button
                        onClick={handleApply}
                        disabled={applying}
                        className="mt-5 w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition disabled:opacity-50"
                      >
                        {applying ? 'Applying…' : 'Apply for gas credit'}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="mt-4 flex items-center gap-2 text-gray-700 font-semibold">
                        <XCircle size={18} className="text-gray-400" /> Not eligible yet
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{eligibility?.reason || 'Keep ordering to qualify.'}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Loans */}
              <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Your loans</h2>
              {loans.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <Zap size={44} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600">
                    No loans yet. If you're eligible, apply above to get gas on credit.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {loans.map((loan) => (
                    <div key={loan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">Loan #{loan.id}</h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                loan.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {loan.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            KES {Number(loan.amount).toLocaleString()} at {Number(loan.interest_rate)}% interest
                          </p>
                        </div>
                        {loan.status === 'active' && (
                          <button
                            onClick={() => handleRepay(loan)}
                            disabled={repaying === loan.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                          >
                            {repaying === loan.id && <Loader2 size={14} className="animate-spin" />}
                            Repay
                          </button>
                        )}
                      </div>

                      <div className="mt-4 bg-red-50 rounded-xl px-4 py-3 inline-block">
                        <p className="text-xs text-red-600">Outstanding</p>
                        <p className="font-bold text-red-700">
                          KES {Number(loan.repayment_balance).toLocaleString()}
                        </p>
                      </div>

                      {loan.repayment_schedule && loan.repayment_schedule.length > 0 && (
                        <div className="mt-5">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Repayment schedule
                          </p>
                          <div className="grid sm:grid-cols-3 gap-2">
                            {loan.repayment_schedule.map((s) => (
                              <div
                                key={s.month}
                                className={`rounded-xl px-4 py-3 text-sm ${
                                  s.paid ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 font-semibold">
                                  {s.paid ? (
                                    <CheckCircle2 size={14} className="text-green-500" />
                                  ) : (
                                    <CalendarDays size={14} className="text-gray-400" />
                                  )}
                                  Month {s.month}
                                </div>
                                <p className="mt-0.5">KES {Number(s.amount).toLocaleString()}</p>
                                <p className="text-xs text-gray-400">
                                  due {new Date(s.dueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};
