
import React, { useState } from 'react';

interface WaiverPageProps {
  onContinue: (data: { waiverName: string, waiverSignature: string }) => void;
  onCancel: () => void;
}

const WaiverPage: React.FC<WaiverPageProps> = ({ onContinue, onCancel }) => {
  const [fullName, setFullName] = useState('');
  const [signature, setSignature] = useState('');

  const handleContinue = () => {
    if (!fullName || !signature) {
      alert("Please sign the waiver to continue");
      return;
    }
    // Pass data back if needed, or just proceed knowing it's signed
    onContinue({ waiverName: fullName, waiverSignature: signature });
  };

  return (
    <div className="bg-[#f8f7f5] dark:bg-[#23180f] min-h-screen font-manrope">
      <header className="flex items-center justify-between border-b border-[#ead9cd] dark:border-[#3d2b1d] px-6 md:px-20 py-4 bg-white dark:bg-[#1a130e]">
        <h2 className="text-xl font-bold tracking-tight uppercase">Boombase</h2>
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <span className="material-symbols-outlined text-primary">person</span>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-2">Liability Waiver & Facility Rules</h1>
          <p className="text-[#a16d45] text-lg">Review our safety terms and sign below to confirm your booking.</p>
        </div>

        <div className="bg-white dark:bg-[#2d1f14] rounded-xl border border-[#ead9cd] dark:border-[#3d2b1d] shadow-sm overflow-hidden mb-8">
          <div className="p-6 bg-[#fcfaf8] dark:bg-[#342417] flex justify-between items-center border-b border-[#ead9cd] dark:border-[#3d2b1d]">
            <span className="text-sm font-bold uppercase tracking-wider text-primary">Legal Agreement</span>
            <span className="text-xs text-[#a16d45]">Updated: Oct 2024</span>
          </div>
          <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar text-sm space-y-4">
            <p className="font-bold text-lg">Indemnity & Hold Harmless</p>
            <p>You agree to indemnify and hold harmless Boombase, its owners, agents, and employees from any and all claims, actions, suits, procedures, costs, expenses, damages, and liabilities, including attorney’s fees, brought as a result of your involvement at Boombase.</p>
            <p className="font-bold text-lg">Risk Acknowledgement</p>
            <p>Basketball is a high-intensity sport. By entering the facility, you acknowledge the inherent risks of participation including but not limited to sprains, fractures, concussions, or more serious injuries.</p>
            <p className="font-bold text-lg">Facility Rules</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Only non-marking basketball shoes are permitted.</li>
              <li>No food or sugary drinks allowed on the court.</li>
              <li>Respect booked time slots and clear the court promptly.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold uppercase">Full Name</label>
              <input
                className="w-full rounded-lg border border-[#ead9cd] dark:border-[#3d2b1d] px-4 py-3 bg-white dark:bg-[#2d1f14] outline-none focus:ring-2 focus:ring-primary/50"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Type your full name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold uppercase">Date</label>
              <input className="w-full rounded-lg border border-[#ead9cd] dark:border-[#3d2b1d] px-4 py-3 bg-white dark:bg-[#2d1f14]" defaultValue={new Date().toLocaleDateString()} readOnly />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold uppercase">Digital Signature</label>
            <div className="relative">
              <input
                className="w-full rounded-xl border-2 border-dashed border-[#ead9cd] dark:border-[#3d2b1d] px-6 py-6 bg-white dark:bg-[#1a120b] font-handwriting text-2xl outline-none focus:border-primary transition-colors"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your signature here..."
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none uppercase text-xs font-bold tracking-widest">
                Signed
              </div>
            </div>
            <p className="text-xs text-slate-400">By typing your name above, you acknowledge that this constitutes your electronic signature and agreement to the terms.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-4 pb-12">
            <button onClick={handleContinue} className="flex-1 bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
              Continue to Booking <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <button onClick={onCancel} className="px-8 py-4 border border-[#ead9cd] dark:border-[#3d2b1d] font-bold rounded-xl">Cancel</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WaiverPage;
