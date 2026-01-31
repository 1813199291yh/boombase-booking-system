
import React, { useState } from 'react';
import { Booking } from '../types';

interface CheckoutPageProps {
  booking: Partial<Booking>;
  onConfirm: (details: { name: string, email: string }) => void;
  onBack: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ booking, onConfirm, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      onConfirm({ name, email });
    }
  };

  return (
    <div className="bg-background-dark text-white min-h-screen font-space">
      <header className="flex items-center justify-between px-10 py-4 border-b border-border-dark sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
          <span className="material-symbols-outlined text-primary">arrow_back</span>
          <h1 className="text-xl font-black uppercase tracking-tighter">Boombase</h1>
        </div>
        <div className="hidden md:block">
          <p className="text-xs uppercase font-bold tracking-widest text-slate-500">Secure Checkout System</p>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-10 py-10">
        <div className="mb-12">
          <div className="flex flex-col gap-3">
            <div className="flex gap-6 justify-between items-center">
              <p className="text-xl font-bold uppercase tracking-tight">Booking Information</p>
              <p className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full uppercase italic">Step 1: Contact & Payment</p>
            </div>
            <div className="rounded-full bg-border-dark h-2 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '33%' }}></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 flex flex-col gap-10">
            <section>
              <div className="flex items-center gap-2 mb-6 border-b border-border-dark pb-3">
                <span className="material-symbols-outlined text-primary">person</span>
                <h2 className="text-2xl font-black uppercase tracking-tight">Your Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Full Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-card-dark border-border-dark rounded-lg h-14 px-4 text-white focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Email Address</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-card-dark border-border-dark rounded-lg h-14 px-4 text-white focus:ring-1 focus:ring-primary outline-none"
                    placeholder="name@email.com"
                  />
                </div>
              </div>
            </section>


          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-card-dark border border-border-dark rounded-xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-border-dark bg-[#1a1a1a]">
                <h3 className="text-lg font-black uppercase tracking-tighter">Reservation Summary</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="size-16 rounded bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">sports_basketball</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary uppercase">Court Selection</p>
                    <p className="text-lg font-black uppercase">{booking.courtType}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm font-bold uppercase">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <span className="material-symbols-outlined text-primary text-sm">event</span>
                    <span>{booking.date || 'Oct 24, 2024'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-400">
                    <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                    <span>{booking.time || 'N/A'}</span>
                  </div>
                </div>

                <div className="border-t border-border-dark pt-6 space-y-3">
                  <div className="flex justify-between text-neutral-400 text-sm">
                    <span>Court Fee</span>
                    <span>${booking.price?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400 text-sm">
                    <span>Processing Fee</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between items-end pt-2 border-t border-border-dark">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Total to Pay</span>
                    <span className="text-3xl font-black">${booking.price?.toFixed(2)}</span>
                  </div>
                </div>
                <button type="submit" className="w-full bg-primary hover:bg-orange-500 h-16 rounded-lg text-white font-black uppercase tracking-widest text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/10">
                  Proceed to Waiver <span className="material-symbols-outlined">chevron_right</span>
                </button>
                <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest">Waiver signature required next</p>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CheckoutPage;
