
import React, { useState, useEffect } from 'react';
import { Booking } from '../types';

interface AdminDashboardProps {
  bookings: Booking[];
  adminEmail: string;
  onUpdateStatus: (id: string, status: Booking['status']) => void;
  onNavigateToSchedule: () => void;
  onNavigateToPayouts: () => void;
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ bookings, adminEmail, onUpdateStatus, onNavigateToSchedule, onNavigateToPayouts, onExit }) => {
  const [filter, setFilter] = useState<'All' | 'Pending Approval' | 'Confirmed'>('All');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleStatusUpdate = (id: string, status: Booking['status'], customerEmail: string, customerName: string) => {
    onUpdateStatus(id, status);
    
    // Simulate Email Trigger
    setNotification({
      message: `Email notification sent to ${customerName} (${customerEmail})`,
      type: status === 'Confirmed' ? 'success' : 'info'
    });
  };

  const filteredBookings = bookings.filter(b => filter === 'All' ? true : b.status === filter);
  const pendingCount = bookings.filter(b => b.status === 'Pending Approval').length;
  
  const totalRevenue = bookings
    .filter(b => b.status === 'Confirmed')
    .reduce((sum, b) => sum + b.price, 0);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-background-dark font-manrope">
      {/* Toast Notification for Email Feedback */}
      {notification && (
        <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-right-10 duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${notification.type === 'success' ? 'bg-green-600 border-green-500' : 'bg-slate-800 border-slate-700'} text-white`}>
            <span className="material-symbols-outlined">{notification.type === 'success' ? 'mail' : 'info'}</span>
            <div>
              <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Customer Notified</p>
              <p className="text-sm font-medium opacity-90">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      <aside className="w-64 bg-[#110c08] text-white flex flex-col fixed h-full z-20">
        <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={onExit}>
          <span className="material-symbols-outlined text-primary text-3xl">sports_basketball</span>
          <h2 className="text-xl font-extrabold tracking-tighter uppercase italic">Boombase</h2>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white bg-primary">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-semibold">Requests</span>
          </button>
          <button onClick={onNavigateToSchedule} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white transition-all text-left">
            <span className="material-symbols-outlined">calendar_month</span>
            <span className="font-semibold">Schedule</span>
          </button>
          <button onClick={onNavigateToPayouts} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white transition-all text-left">
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
            <h1 className="text-4xl font-black tracking-tight uppercase italic">Operations <span className="text-primary">Center</span></h1>
            <p className="text-slate-500 font-medium">Managing facility access for {adminEmail}</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white dark:bg-card-dark border border-border-dark p-4 rounded-2xl flex flex-col min-w-[160px]">
              <span className="text-[10px] font-black uppercase text-slate-500">Confirmed Revenue</span>
              <span className="text-2xl font-black text-green-500">${totalRevenue.toLocaleString()}</span>
            </div>
            <div className="bg-white dark:bg-card-dark border border-border-dark p-4 rounded-2xl flex flex-col min-w-[160px]">
              <span className="text-[10px] font-black uppercase text-slate-500">Pending Actions</span>
              <span className="text-2xl font-black text-primary">{pendingCount}</span>
            </div>
          </div>
        </header>

        <div className="flex gap-4 mb-8">
           {['All', 'Pending Approval', 'Confirmed'].map((t) => (
             <button 
              key={t}
              onClick={() => setFilter(t as any)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-card-dark border border-border-dark text-slate-500'}`}
             >
               {t}
             </button>
           ))}
        </div>

        <div className="space-y-4">
          {filteredBookings.length === 0 && (
            <div className="bg-white dark:bg-card-dark p-20 rounded-2xl border border-dashed border-border-dark text-center">
               <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">inventory_2</span>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Clear queue. No requests found.</p>
            </div>
          )}
          
          {filteredBookings.map((b) => (
            <div key={b.id} className="group bg-white dark:bg-card-dark rounded-2xl border border-border-dark p-6 transition-all hover:border-primary/50 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex gap-6 items-center flex-1">
                  <div className={`size-20 rounded-2xl flex flex-col items-center justify-center text-xs font-black border-2 ${b.status === 'Confirmed' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                     <span className="material-symbols-outlined text-3xl mb-1">{b.courtType === 'Full Court' ? 'fullscreen' : 'splitscreen'}</span>
                     {b.courtType === 'Full Court' ? 'FULL' : 'HALF'}
                  </div>
                  <div>
                     <div className="flex items-center gap-3 mb-2">
                        <span className="font-black uppercase tracking-tight text-xl">{b.customerName}</span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${b.status === 'Confirmed' ? 'bg-green-500 text-white' : b.status === 'Declined' ? 'bg-red-500 text-white' : 'bg-primary text-white'}`}>
                           {b.status}
                           {(b.status === 'Confirmed' || b.status === 'Declined') && (
                             <span className="material-symbols-outlined text-[10px]" title="Customer Notified via Email">mail</span>
                           )}
                        </span>
                     </div>
                     <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-2 bg-slate-100 dark:bg-background-dark px-3 py-1 rounded-lg">
                          <span className="material-symbols-outlined text-sm">calendar_today</span> {b.date}
                        </span>
                        <span className="flex items-center gap-2 bg-slate-100 dark:bg-background-dark px-3 py-1 rounded-lg">
                          <span className="material-symbols-outlined text-sm">timer</span> {b.time}
                        </span>
                        <span className="flex items-center gap-2 text-primary">
                          <span className="material-symbols-outlined text-sm">payments</span> ${b.price}
                        </span>
                     </div>
                  </div>
               </div>

               <div className="flex gap-3 w-full md:w-auto">
                  {b.status === 'Pending Approval' && (
                    <>
                      <button 
                        onClick={() => handleStatusUpdate(b.id, 'Confirmed', b.email, b.customerName)}
                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(b.id, 'Declined', b.email, b.customerName)}
                        className="flex-1 md:flex-none bg-white dark:bg-background-dark border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {b.status === 'Confirmed' && (
                    <button 
                      onClick={() => onUpdateStatus(b.id, 'Refunded')}
                      className="w-full md:w-auto px-8 py-3 rounded-xl border border-border-dark text-slate-500 font-black uppercase tracking-widest text-xs hover:border-red-500 hover:text-red-500 transition-all"
                    >
                      Issue Refund
                    </button>
                  )}
                  {b.status === 'Refunded' && (
                    <div className="flex items-center gap-2 text-slate-400 font-black uppercase italic text-xs tracking-widest bg-slate-100 dark:bg-background-dark px-6 py-3 rounded-xl">
                      <span className="material-symbols-outlined text-sm">history</span>
                      Refunded
                    </div>
                  )}
               </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
