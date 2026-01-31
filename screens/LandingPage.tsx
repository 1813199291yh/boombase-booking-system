
import React, { useState, useEffect } from 'react';
import { CourtType } from '../types';
import { api } from '../src/api';

interface LandingPageProps {
  onBookNow: (court: CourtType, price: number, time: string, duration: number) => void;
  onAdminClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onBookNow, onAdminClick }) => {
  const [selectedCourt, setSelectedCourt] = useState<CourtType | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(1);
  const [occupiedSlots, setOccupiedSlots] = useState<Set<string>>(new Set());

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

  // Load bookings and calculate blocked slots
  useEffect(() => {
    if (!selectedDate || !selectedCourt) return;

    const fetchAvailability = async () => {
      try {
        const bookings = await api.getBookings();
        const blocked = new Set<string>();

        bookings.forEach((b: any) => {
          // Filter by date
          if (b.date !== selectedDate) return;

          // Filter by Status (Confirmed, Pending, Declined/Blocked)
          const isBlocking = b.status === 'Confirmed' || b.status === 'Pending Approval' || b.status === 'Declined';
          if (!isBlocking) return;

          // Filter by Court (Full blocks Half, Half blocks Full?? For now strict match or Block logic)
          // If Full Court is booked, Half Court is also unavailable.
          if (b.courtType === 'Full Court' || b.courtType === selectedCourt) {
            // Parse Time Range
            if (b.time.includes('-')) {
              const [start, end] = b.time.split(' - ');
              const startIdx = timeSlots.indexOf(start);
              const endIdx = timeSlots.indexOf(end);

              if (startIdx !== -1 && endIdx !== -1) {
                for (let i = startIdx; i < endIdx; i++) {
                  blocked.add(timeSlots[i]);
                }
              }
            } else {
              // Single slot block (Admin Manual Block)
              blocked.add(b.time);
            }
          }
        });
        setOccupiedSlots(blocked);
      } catch (e) {
        console.error("Failed to load bookings", e);
      }
    };

    fetchAvailability();
  }, [selectedDate, selectedCourt]);


  const getDuration = () => duration;

  const getPrice = () => {
    if (!selectedCourt) return 0;
    const hourlyRate = selectedCourt === 'Full Court' ? 150 : 75;
    return hourlyRate * getDuration();
  };

  const getTimeRangeDisplay = () => {
    if (!startTime) return "";

    // Calculate end time string based on start time + duration
    const startIndex = timeSlots.indexOf(startTime);
    if (startIndex === -1) return "";

    // duration 1 = 2 slots -> index + 2. e.g. 8:00 (idx 0) + 1hr = 9:00 (idx 2)
    const slotsCount = duration * 2;
    const endIndex = startIndex + slotsCount;
    const endTime = timeSlots[endIndex] || "10:30 PM"; // Fallback if goes past

    return `${startTime} - ${endTime}`;
  };

  const handleBookingClick = () => {
    if (selectedCourt && startTime) {
      // Validate Overlap
      const currentIndices = [];
      const startIdx = timeSlots.indexOf(startTime);
      const slotsCount = duration * 2;
      for (let i = 0; i < slotsCount; i++) {
        if (timeSlots[startIdx + i]) currentIndices.push(timeSlots[startIdx + i]);
      }

      const hasOverlap = currentIndices.some(t => occupiedSlots.has(t));
      if (hasOverlap) {
        alert("Selected time range overlaps with an existing booking/block. Please choose another time.");
        return;
      }

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
            Reserve your session at our premium facility. <br />Check real-time availability and secure your court instantly.
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
                  onChange={(e) => { setSelectedDate(e.target.value); setStartTime(null); }}
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

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-primary mb-3 block">3. Session Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6].map(d => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`py-3 rounded-lg text-xs font-black uppercase transition-all border-2 ${duration === d
                        ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                        : 'bg-card-dark text-slate-500 border-border-dark hover:border-white/20 hover:text-white'
                        }`}
                    >
                      {d}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-black uppercase tracking-widest text-primary italic">4. Select Start Time</label>
                {startTime && (
                  <button onClick={() => setStartTime(null)} className="text-xs font-black uppercase text-red-500 hover:text-red-400 transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">close</span> Reset Selection
                  </button>
                )}
              </div>

              <div className="space-y-12">
                {[
                  { title: "Morning", icon: "wb_twilight", color: "text-orange-300", filter: (h: number, p: string) => p === 'AM' && h !== 12 },
                  { title: "Afternoon", icon: "wb_sunny", color: "text-orange-500", filter: (h: number, p: string) => p === 'PM' && (h === 12 || h < 5) },
                  { title: "Evening", icon: "dark_mode", color: "text-indigo-400", filter: (h: number, p: string) => p === 'PM' && (h >= 5 && h !== 12) }
                ].map((section) => (
                  <div key={section.title} className="relative">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-2">
                      <span className={`material-symbols-outlined ${section.color} text-2xl drop-shadow-[0_0_8px_rgba(255,165,0,0.5)]`}>{section.icon}</span>
                      <h3 className={`text-xl font-display font-bold uppercase italic tracking-wider ${section.color} drop-shadow-md`}>{section.title}</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-4">
                      {timeSlots.filter(slot => {
                        const [t, p] = slot.split(' ');
                        let h = parseInt(t.split(':')[0]);
                        if (h === 12 && p === 'AM') h = 0; // Midnight check, though not in range
                        return section.filter(h, p);
                      }).map((slot) => {
                        const index = timeSlots.indexOf(slot);
                        const startIndex = startTime ? timeSlots.indexOf(startTime) : -1;

                        // Calculate derived selected slots based on duration
                        const slotsCount = duration * 2; // 1hr = 2 slots
                        const endIndex = startIndex !== -1 ? startIndex + slotsCount - 1 : -1;

                        const isStart = index === startIndex;
                        const isEnd = index === endIndex;
                        const isMiddle = index > startIndex && index < endIndex;
                        const isSelected = index >= startIndex && index <= endIndex && startIndex !== -1;
                        const isOccupied = occupiedSlots.has(slot);

                        let stateStyles = 'border-white/10 bg-white/5 text-slate-400 hover:border-white/30 hover:bg-white/10';
                        if (isOccupied) {
                          stateStyles = 'border-red-500/20 bg-red-500/5 text-red-500/50 cursor-not-allowed';
                        } else if (isStart) stateStyles = 'border-primary bg-primary text-white shadow-[0_0_30px_rgba(255,138,0,0.5)] z-20 scale-105';
                        else if (isEnd) stateStyles = 'border-primary bg-primary text-white shadow-[0_0_30px_rgba(255,138,0,0.5)] z-20 scale-105';
                        else if (isMiddle) stateStyles = 'border-primary/50 bg-primary/20 text-white z-10';

                        return (
                          <button
                            key={slot}
                            disabled={isOccupied}
                            onClick={() => {
                              // Set new Start Time
                              setStartTime(slot);
                              // Reset duration to default 1hr if selecting new time? Or keep? Let's keep for fluidity.
                              if (!startTime) setDuration(1);
                            }}
                            className={`relative h-16 rounded-xl border-2 font-black transition-all duration-300 flex flex-col items-center justify-center group overflow-hidden ${stateStyles}`}
                          >
                            {/* Industrial Grid Background for selected */}
                            {isSelected && !isOccupied && (
                              <div className="absolute inset-0 opacity-20 pointer-events-none"
                                style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '4px 4px' }}>
                              </div>
                            )}

                            <span className="text-sm tracking-tight relative z-10">
                              {isOccupied ? <span className="material-symbols-outlined text-sm">block</span> : slot}
                            </span>

                            {(isStart || isEnd) && !isOccupied && (
                              <span className="absolute -top-2 -right-2 size-6 bg-white text-primary rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-75 ring-4 ring-black">
                                <span className="material-symbols-outlined text-[14px] font-black">
                                  {isStart ? 'flag' : 'check'}
                                </span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {selectedCourt && startTime && (
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

                  <div className="relative z-10 flex flex-col items-center md:items-end gap-6 w-full md:w-auto mt-8 md:mt-0">
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
