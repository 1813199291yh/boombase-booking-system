
import React from 'react';

interface ConfirmationPageProps {
  onGoHome: () => void;
}

const ConfirmationPage: React.FC<ConfirmationPageProps> = ({ onGoHome }) => {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-manrope">
      <header className="flex justify-center py-8">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-4xl">sports_basketball</span>
          <h2 className="text-2xl font-extrabold tracking-tighter uppercase italic">Boombase</h2>
        </div>
      </header>

      <main className="flex-1 flex justify-center px-4 pb-20">
        <div className="max-w-[600px] w-full flex flex-col items-center">
          <div className="bg-green-50 text-green-700 px-6 py-4 rounded-2xl border border-green-100 flex items-center gap-4 mb-8 w-full animate-bounce">
             <span className="material-symbols-outlined text-3xl">task_alt</span>
             <div>
                <p className="font-black uppercase text-sm tracking-tight">Payment Successful</p>
                <p className="text-xs font-bold opacity-80">Booking request sent to admin for approval.</p>
             </div>
          </div>

          <div className="text-center py-2 mb-8">
            <h1 className="text-4xl font-extrabold leading-tight pb-2">Hang Tight!</h1>
            <p className="text-[#a16d45] text-lg font-medium">Your request is being reviewed by the Boombase team.</p>
          </div>

          <div className="w-full bg-white dark:bg-[#2d1e13] rounded-2xl shadow-xl border border-[#ead9cd] dark:border-[#3d2a1c] overflow-hidden mb-10">
            <div className="p-8 space-y-6">
               <div className="flex flex-col items-center text-center gap-4 pb-6 border-b border-slate-100">
                  <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">mail</span>
                  </div>
                  <h3 className="font-black uppercase tracking-tighter">What's Next?</h3>
               </div>
               
               <div className="space-y-4">
                  <div className="flex gap-4">
                     <span className="size-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">1</span>
                     <p className="text-sm font-bold text-slate-600 italic">Facility Admin reviews the booking time slot availability.</p>
                  </div>
                  <div className="flex gap-4">
                     <span className="size-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">2</span>
                     <p className="text-sm font-bold text-slate-600 italic">You receive an email confirmation once accepted.</p>
                  </div>
                  <div className="flex gap-4">
                     <span className="size-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">3</span>
                     <p className="text-sm font-bold text-slate-600 italic">If declined, a full refund is automatically issued to your card.</p>
                  </div>
               </div>
            </div>
          </div>

          <button onClick={onGoHome} className="w-full max-w-[320px] bg-primary hover:bg-orange-600 text-white font-bold h-14 rounded-xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all text-lg uppercase tracking-widest">
            <span className="material-symbols-outlined">home</span>
            Return Home
          </button>
        </div>
      </main>
    </div>
  );
};

export default ConfirmationPage;
