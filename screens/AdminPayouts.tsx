
import React, { useState } from 'react';

interface AdminPayoutsProps {
  onNavigateToDashboard: () => void;
  onNavigateToSchedule: () => void;
  adminEmail: string;
  onExit: () => void;
}

import { api } from '../src/api';

// ... (other imports)

const AdminPayouts: React.FC<AdminPayoutsProps> = ({ onNavigateToDashboard, onNavigateToSchedule, adminEmail, onExit }) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [payouts, setPayouts] = useState<any[]>([]);

  const [bookings, setBookings] = useState<any[]>([]);

  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    bankName: 'Chase Business Checking',
    accountLast4: '9210'
  });

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [payoutsData, bookingsData, settingsData] = await Promise.all([
        api.getPayouts(),
        api.getBookings(),
        api.getSettings() // Fetch settings
      ]);
      setPayouts(payoutsData);
      setBookings(bookingsData);

      // Update state if settings exist
      if (settingsData && (settingsData.bank_name || settingsData.account_last4)) {
        setBankInfo({
          bankName: settingsData.bank_name || 'Chase Business Checking',
          accountLast4: settingsData.account_last4 || '9210'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveBankInfo = async () => {
    try {
      await api.updateSettings({
        bank_name: bankInfo.bankName,
        account_last4: bankInfo.accountLast4
      });
      setIsEditingBank(false);
      // Optional: Show success toast
    } catch (e) {
      console.error('Failed to save bank info', e);
      alert('Failed to save bank info');
    }
  };

  // Calculate stats
  const totalRevenue = bookings
    .filter((b: any) => b.status === 'Confirmed')
    .reduce((sum: number, b: any) => sum + b.price, 0);

  const totalPayoutsst = payouts
    .filter((p: any) => p.status !== 'Failed') // Count all non-failed payouts against balance
    .reduce((sum: number, p: any) => sum + p.amount, 0);

  const pendingProcessing = payouts
    .filter((p: any) => p.status === 'Processing')
    .reduce((sum: number, p: any) => sum + p.amount, 0);

  const availableBalance = totalRevenue - totalPayoutsst;

  const handleRequestPayout = async () => {
    if (availableBalance <= 0) {
      alert("No funds available for withdrawal.");
      return;
    }

    try {
      await api.requestPayout(availableBalance);
      await loadData();
      setShowRequestModal(false);
      alert("Payout requested successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to request payout");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-background-dark font-manrope">
      <aside className="w-64 bg-[#110c08] text-white flex flex-col fixed h-full z-20">
        <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={onExit}>
          <span className="material-symbols-outlined text-primary text-3xl">sports_basketball</span>
          <h2 className="text-xl font-extrabold tracking-tighter uppercase italic">Boombase</h2>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <button onClick={onNavigateToDashboard} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white transition-all text-left">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-semibold">Requests</span>
          </button>
          <button onClick={onNavigateToSchedule} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white transition-all text-left">
            <span className="material-symbols-outlined">calendar_month</span>
            <span className="font-semibold">Schedule</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white bg-primary text-left">
            <span className="material-symbols-outlined">payments</span>
            <span className="font-semibold">Payouts</span>
          </button>
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Authenticated As</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-sm">D</div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">Damon</p>
              <p className="text-[9px] text-slate-400 truncate uppercase tracking-tighter">{adminEmail}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight uppercase italic">Earnings & <span className="text-primary">Payouts</span></h1>
            <p className="text-slate-500 font-medium">Withdraw facility revenue to your connected accounts.</p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-primary hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">account_balance_wallet</span>
            Request Payout
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-card-dark border border-border-dark p-8 rounded-3xl shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-6xl">currency_exchange</span>
            </div>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Available Balance</span>
            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">${availableBalance.toLocaleString()}</span>
            <p className="text-[10px] font-bold text-green-500 mt-2 uppercase tracking-widest">Ready for withdrawal</p>
          </div>

          <div className="bg-white dark:bg-card-dark border border-border-dark p-8 rounded-3xl shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-6xl">history</span>
            </div>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Pending Processing</span>
            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">${pendingProcessing.toLocaleString()}</span>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Clearing in 24-48 hours</p>
          </div>

          <div className="bg-white dark:bg-card-dark border border-border-dark p-8 rounded-3xl shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-6xl">payments</span>
            </div>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Next Scheduled Payout</span>
            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">Oct 27</span>
            <p className="text-[10px] font-bold text-primary mt-2 uppercase tracking-widest">Weekly automated transfer</p>
          </div>
        </div>

        <section className="bg-white dark:bg-card-dark border border-border-dark rounded-3xl shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-border-dark flex justify-between items-center">
            <h3 className="font-black uppercase italic tracking-tighter text-lg">Transaction History</h3>
            <button className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-background-dark/50 text-[10px] font-black uppercase tracking-widest text-slate-500 text-left">
                  <th className="px-8 py-4">Transaction ID</th>
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4">Method</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6 font-bold text-slate-400 text-sm">{p.id}</td>
                    <td className="px-8 py-6 font-bold text-sm">{p.date}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-sm">account_balance</span>
                        <span className="text-sm font-bold uppercase tracking-tight">{p.method}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary animate-pulse'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right font-black italic text-lg tracking-tight">${p.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {showRequestModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowRequestModal(false)}></div>
          <div className="relative bg-card-dark border border-border-dark w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-border-dark flex justify-between items-center bg-[#1a1a1a]">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Request Payout</h3>
              <button onClick={() => setShowRequestModal(false)} className="size-10 rounded-full border border-border-dark flex items-center justify-center hover:bg-white/5 text-white">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Available for Withdrawal</label>
                <div className="text-5xl font-black italic tracking-tighter text-white">${availableBalance.toLocaleString()}</div>
              </div>

              <div className="bg-background-dark p-6 rounded-2xl border border-border-dark">
                {!isEditingBank ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">To Account</span>
                      <span onClick={() => setIsEditingBank(true)} className="text-primary text-[10px] font-black uppercase cursor-pointer hover:underline">Change</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded bg-white/5 flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-2xl">account_balance</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">{bankInfo.bankName}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Ending in ••••{bankInfo.accountLast4}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-white font-bold text-sm">Update Bank Info</h4>
                      <span onClick={() => setIsEditingBank(false)} className="material-symbols-outlined text-gray-500 cursor-pointer text-sm">close</span>
                    </div>
                    <input
                      value={bankInfo.bankName}
                      onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                      placeholder="Bank Name"
                      className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
                    />
                    <input
                      value={bankInfo.accountLast4}
                      onChange={(e) => setBankInfo({ ...bankInfo, accountLast4: e.target.value })}
                      placeholder="Last 4 Digits"
                      maxLength={4}
                      className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
                    />
                    <button
                      onClick={handleSaveBankInfo}
                      className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded text-xs font-bold uppercase"
                    >
                      Save Details
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex gap-3 text-primary">
                <span className="material-symbols-outlined text-xl">info</span>
                <p className="text-xs font-bold leading-relaxed">
                  Funds will be available in your account within 1-2 business days depending on your bank's processing time.
                </p>
              </div>

              <button
                onClick={handleRequestPayout}
                className="w-full bg-primary hover:bg-orange-600 text-white h-16 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
              >
                Confirm Withdrawal
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayouts;
