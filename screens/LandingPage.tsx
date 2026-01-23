
import React, { useState } from 'react';
import { CourtType } from '../types';

interface LandingPageProps {
  onBookNow: (court: CourtType, price: number, time: string, duration: number) => void;
  onAdminClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onBookNow, onAdminClick }) => {
  const [selectedCourt, setSelectedCourt] = useState<CourtType | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Generate 30-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 21; hour++) {
      for (let min of ["00", "30"]) {
        let displayHour = hour > 12 ? hour - 12 : hour;
        let period = hour >= 12 ? "PM" : "AM";
        slots.push(`${displayHour.toString().padStart(2, '0')}:${min} ${period}`);
      }
    }
    slots.push("10:00 PM"); // Final end point
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleSlotClick = (slot: string) => {
    setSelectedSlots(prev => {
      if (prev.includes(slot)) {
        return prev.filter(s => s !== slot);
      } else {
        const newSlots = [...prev, slot].sort((a, b) => {
          return timeSlots.indexOf(a) - timeSlots.indexOf(b);
        });
        return newSlots;
      }
    });
  };

  const getDuration = () => selectedSlots.length * 0.5; // Each slot is 30 mins
  
  const getPrice = () => {
    if (!selectedCourt) return 0;
    const hourlyRate = selectedCourt === 'Full Court' ? 150 : 75;
    return hourlyRate * getDuration();
  };

  const getTimeRangeDisplay = () => {
    if (selectedSlots.length === 0) return "";
    if (selectedSlots.length === 1) return `${selectedSlots[0]} (30 Mins)`;
    
    const indices = selectedSlots.map(s => timeSlots.indexOf(s));
    const isContiguous = indices.every((val, i) => i === 0 || val === indices[i - 1] + 1);
    
    if (isContiguous) {
      const start = selectedSlots[0];
      const lastSelectedIdx = timeSlots.indexOf(selectedSlots[selectedSlots.length - 1]);
      const end = timeSlots[lastSelectedIdx + 1] || "10:30 PM";
      return `${start} - ${end}`;
    }
    
    return "Multiple Slots Selected";
  };

  const handleBookingClick = () => {
    if (selectedCourt && selectedSlots.length > 0) {
      onBookNow(selectedCourt, getPrice(), getTimeRangeDisplay(), getDuration());
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-background-dark text-white font-sans">
      <nav className="fixed w-full z-50 bg-background-dark/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4 cursor-pointer">
              <h1 className="font-display text-2xl font-bold italic tracking-tighter">BOOMBASE</h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={onAdminClick} className="text-sm font-semibold uppercase tracking-widest hover:text-primary transition-colors">Admin Panel</button>
              <a className="text-sm font-semibold uppercase tracking-widest hover:text-primary transition-colors" href="#booking">Book Now</a>
              <a className="text-sm font-semibold uppercase tracking-widest hover:text-primary transition-colors" href="#facility">Facility</a>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            alt="Boombase Court Hero" 
            className="w-full h-full object-cover opacity-40" 
            src="https://images.unsplash.com/photo-1544919982-b61976f0ba43?q=80&w=2000&auto=format&fit=crop" 
          />
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute inset-0 court-overlay"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 text-center md:text-left">
          <h1 className="font-display text-6xl md:text-9xl text-white uppercase leading-none italic tracking-tighter">
            BOOMBASE <br /><span className="text-primary">ONLINE BOOKING</span>
          </h1>
          <p className="mt-6 text-xl text-slate-200 max-w-xl leading-relaxed font-manrope font-semibold">
            Reserve your session at our premium facility. <br/>Check real-time availability and secure your court instantly.
          </p>
          <div className="mt-10">
            <a href="#booking" className="bg-primary hover:bg-orange-600 text-white px-10 py-4 rounded font-bold uppercase tracking-widest text-lg transition-all inline-flex items-center gap-2 shadow-2xl">
              Start Reservation
              <span className="material-symbols-outlined">calendar_month</span>
            </a>
          </div>
        </div>
      </section>

      <section id="booking" className="py-24 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl uppercase italic tracking-tighter mb-4">Live <span className="text-primary">Schedule</span></h2>
            <p className="text-slate-400 font-manrope">Select 30-min intervals to build your custom session.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1 space-y-8">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-primary mb-3 block">1. Date</label>
                <input 
                  type="date" 
                  min={today}
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlots([]); }}
                  className="w-full bg-card-dark border-border-dark rounded-xl h-14 px-4 text-white font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-primary mb-3 block">2. Court Type</label>
                <div className="space-y-3">
                  <button 
                    onClick={() => setSelectedCourt('Full Court')}
                    className={`group w-full p-4 rounded-xl border-2 text-left transition-all ${selectedCourt === 'Full Court' ? 'border-primary bg-primary/10' : 'border-border-dark bg-card-dark hover:border-white/20'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-bold uppercase italic text-lg">Full Court</div>
                      <span className={`material-symbols-outlined transition-transform ${selectedCourt === 'Full Court' ? 'scale-110' : 'scale-90 text-slate-600'}`}>check_circle</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-bold">$150/hr • Up to 10 Players</div>
                  </button>
                  <button 
                    onClick={() => setSelectedCourt('Half Court')}
                    className={`group w-full p-4 rounded-xl border-2 text-left transition-all ${selectedCourt === 'Half Court' ? 'border-primary bg-primary/10' : 'border-border-dark bg-card-dark hover:border-white/20'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-bold uppercase italic text-lg">Half Court</div>
                      <span className={`material-symbols-outlined transition-transform ${selectedCourt === 'Half Court' ? 'scale-110' : 'scale-90 text-slate-600'}`}>check_circle</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-bold">$75/hr • Up to 4 Players</div>
                  </button>
                </div>
              </div>

              {selectedCourt && (
                <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl animate-in fade-in slide-in-from-left-4 duration-500">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Facility Note</p>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                    All {selectedCourt} bookings include professional-grade Spalding basketballs and filtered water stations.
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-black uppercase tracking-widest text-primary italic">3. Select Your Blocks (30 min each)</label>
                {selectedSlots.length > 0 && (
                  <button onClick={() => setSelectedSlots([])} className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">close</span> Reset
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-2">
                {timeSlots.map((slot) => {
                  const isSelected = selectedSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => handleSlotClick(slot)}
                      className={`relative py-4 rounded-lg border-2 font-black transition-all flex flex-col items-center justify-center group
                        ${isSelected 
                          ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(255,138,0,0.3)] z-10' 
                          : 'bg-card-dark border-border-dark text-slate-500 hover:border-primary/50 hover:text-white'}`}
                    >
                      <span className="text-[13px] tracking-tight">{slot}</span>
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 size-5 bg-white text-primary rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50">
                          <span className="material-symbols-outlined text-[12px] font-black">done</span>
                        </span>
                      )}
                      <div className="text-[9px] font-bold opacity-50 mt-0.5">30 MIN</div>
                    </button>
                  );
                })}
              </div>

              {selectedCourt && selectedSlots.length > 0 && (
                <div className="mt-12 p-8 bg-white text-black rounded-3xl flex flex-col md:flex-row justify-between items-center gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-primary text-white text-[9px] font-black uppercase rounded tracking-widest">Reserved Slot</span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date: {formatDateDisplay(selectedDate)}</p>
                    </div>
                    <h4 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">
                      {selectedCourt}
                    </h4>
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-bold text-slate-800 tracking-tight">{getTimeRangeDisplay()}</p>
                      <div className="h-6 w-px bg-slate-200"></div>
                      <p className="text-lg font-black text-primary uppercase italic">{getDuration()} HOURS</p>
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-col items-center md:items-end gap-6 w-full md:w-auto">
                    <div className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Session Total</span>
                        <div className="text-6xl font-black italic tracking-tighter leading-none flex items-start">
                          <span className="text-2xl mt-1">$</span>
                          {getPrice()}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          {getDuration()} hrs x ${selectedCourt === 'Full Court' ? 150 : 75}/hr
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={handleBookingClick}
                      className="group w-full md:w-auto bg-black text-white px-10 py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95"
                    >
                      Finalize Booking
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-white py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center text-center md:text-left">
            <div>
              <h3 className="font-display text-4xl font-bold italic text-primary mb-2">BOOMBASE</h3>
              <p className="text-slate-500 font-manrope font-semibold text-sm">Industrial-grade hoops for the elite grind.</p>
            </div>
            <div className="flex justify-center gap-8">
              <span className="material-symbols-outlined text-slate-500 hover:text-white cursor-pointer transition-colors">brand_awareness</span>
              <span className="material-symbols-outlined text-slate-500 hover:text-white cursor-pointer transition-colors">sports_handball</span>
              <span className="material-symbols-outlined text-slate-500 hover:text-white cursor-pointer transition-colors">public</span>
            </div>
            <div className="md:text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">© 2024 Boombase Facility MGMT</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
