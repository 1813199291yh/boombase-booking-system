// Force redeploy for Vercel
import React, { useState, useEffect } from 'react';
import { api } from '../src/api';
import { CourtType } from '../types';

interface AdminScheduleProps {
  onNavigateToDashboard: () => void;
  onNavigateToPayouts: () => void;
  onExit: () => void;
}

const AdminSchedule: React.FC<AdminScheduleProps> = ({ onNavigateToDashboard, onNavigateToPayouts, onExit }) => {
  const [selectedWeek, setSelectedWeek] = useState('Oct 21 – 27, 2024');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [recurrence, setRecurrence] = useState<'One-Time' | 'Weekly' | 'Monthly'>('One-Time');
  const [blockScope, setBlockScope] = useState<CourtType>('Full Court');

  // Store full booking objects now, not just indices
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const data = await api.getBookings();
      setBookings(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Determine the start of the current week (Monday)
  const getStartOfWeek = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));

  // Format the week string for display
  const getWeekString = (start: Date) => {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
  };

  useEffect(() => {
    // Update the display string
    setSelectedWeek(getWeekString(currentWeekStart));
  }, [currentWeekStart]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 21; hour++) {
      for (let min of ["00", "30"]) {
        let displayHour = hour > 12 ? hour - 12 : hour;
        let period = hour >= 12 ? "PM" : "AM";
        slots.push(`${displayHour.toString().padStart(2, '0')}:${min} ${period}`);
      }
    }
    return slots;
  };

  const hours = generateTimeSlots();

  // Generate the 7 days headers based on currentWeekStart
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayNum = d.getDate();
    return `${dayName} ${dayNum}`;
  });

  // Helper to map grid index to DateTime
  const getSlotDateTime = (dayIdx: number, slotIdx: number) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + dayIdx);

    // Use Local Time for string, not UTC
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const hour = 8 + Math.floor(slotIdx / 2);
    const min = (slotIdx % 2) === 0 ? '00' : '30';

    let displayHour = hour > 12 ? hour - 12 : hour;
    let period = hour >= 12 ? "PM" : "AM";
    const timeStr = `${displayHour.toString().padStart(2, '0')}:${min} ${period}`;

    return { date: dateStr, time: timeStr };
  };




  const handleBlockSlot = async (dayIdx: number, hourIdx: number) => {
    const { date, time } = getSlotDateTime(dayIdx, hourIdx);
    const existing = bookings.find(b => b.date === date && b.time === time);

    if (existing) {
      if (existing.status === 'Confirmed') {
        alert("This slot is booked by a customer. Please reject/cancel it from the Dashboard first.");
        return;
      }
      if (existing.status === 'Declined') {
        alert("Unblocking not fully implemented in API yet.");
      }
    } else {
      // Create Block
      try {
        await api.createBooking({
          customerName: 'Facility Block',
          email: 'admin@internal',
          courtType: blockScope,
          date: date,
          time: time,
          status: 'Declined', // Using 'Declined' as 'Block'
          price: 0,
          waiverSigned: true
        } as any);
        await loadSchedule();
      } catch (e) {
        console.error(e);
        alert("Failed to block slot");
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-background-dark font-manrope overflow-hidden">
      <aside className="w-64 border-r border-border-dark bg-white dark:bg-card-dark flex flex-col justify-between p-6 z-30">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onExit}>
            <div className="bg-primary size-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined font-black">sports_basketball</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter italic leading-none">BOOMBASE</h1>
              <p className="text-[9px] text-primary font-black uppercase tracking-widest">Admin Control</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/10 text-left">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              <span>Schedule</span>
            </button>
            <button onClick={onNavigateToDashboard} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/5 transition-all font-black uppercase text-xs tracking-widest text-left">
              <span className="material-symbols-outlined text-sm">dashboard</span>
              <span>Dashboard</span>
            </button>
            <button onClick={onNavigateToPayouts} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/5 transition-all font-black uppercase text-xs tracking-widest text-left">
              <span className="material-symbols-outlined text-sm">payments</span>
              <span>Payouts</span>
            </button>
            <button onClick={() => setShowBlockModal(true)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/5 transition-all font-black uppercase text-xs tracking-widest text-left">
              <span className="material-symbols-outlined text-sm">block</span>
              <span>Block Slots</span>
            </button>
          </nav>
        </div>

        <div className="bg-slate-100 dark:bg-background-dark p-5 rounded-2xl border border-border-dark">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Facility Status</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-400">Temp</span>
              <span className="text-white">72°F</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-400">Lights</span>
              <span className="text-green-500">100% ON</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 border-b border-border-dark px-8 flex items-center justify-between bg-white dark:bg-card-dark z-20">
          <div className="flex items-center gap-8">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">Schedule: <span className="text-primary">{selectedWeek}</span></h2>
            <div className="flex bg-slate-100 dark:bg-background-dark p-1 rounded-xl gap-1">
              <button
                onClick={() => {
                  const prev = new Date(currentWeekStart);
                  prev.setDate(prev.getDate() - 7);
                  setCurrentWeekStart(prev);
                }}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-card-dark rounded-lg shadow-sm hover:text-primary transition-colors"
              >
                Prev Week
              </button>
              <button
                onClick={() => {
                  const next = new Date(currentWeekStart);
                  next.setDate(next.getDate() + 7);
                  setCurrentWeekStart(next);
                }}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-card-dark rounded-lg shadow-sm hover:text-primary transition-colors"
              >
                Next Week
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowBlockModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-600/20 hover:scale-105 transition-all"
            >
              <span className="material-symbols-outlined text-sm">lock</span>
              Bulk Block
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-background-dark p-6">
          <div className="min-w-[1200px] bg-white dark:bg-card-dark rounded-3xl border border-border-dark shadow-2xl overflow-hidden">
            <div className="px-8 py-4 border-b border-border-dark flex gap-8 items-center bg-slate-50/50 dark:bg-card-dark/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="size-3 rounded-sm bg-primary"></div> Full Court
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="size-3 rounded-sm bg-blue-500"></div> Half Court
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="size-3 rounded-sm bg-slate-200 dark:bg-slate-800 border-2 border-dashed border-slate-400/50"></div> Blocked
              </div>
            </div>

            <div className="grid grid-cols-[100px_repeat(7,1fr)] bg-slate-50/80 dark:bg-background-dark/80 sticky top-0 z-10 border-b border-border-dark">
              <div className="h-16 flex items-center justify-center font-black text-slate-500 text-[10px] tracking-widest uppercase">Time</div>
              {days.map((day, i) => (
                <div key={i} className={`h-16 flex flex-col items-center justify-center border-l border-border-dark`}>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{day.split(' ')[0]}</span>
                  <span className="text-xl font-black italic tracking-tighter">{day.split(' ')[1]}</span>
                </div>
              ))}
            </div>

            <div className="relative">
              {hours.map((hour, hIdx) => (
                <div key={hIdx} className="grid grid-cols-[100px_repeat(7,1fr)] h-12 border-b border-border-dark/50">
                  <div className="flex items-center justify-center text-[9px] font-black text-slate-500 uppercase tracking-widest border-r border-border-dark">{hour}</div>
                  {days.map((_, dIdx) => {
                    const { date, time } = getSlotDateTime(dIdx, hIdx);
                    // Find a booking/block for this slot
                    const booking = bookings.find(b => b.date === date && b.time === time);

                    const isOccupied = booking && (booking.status === 'Confirmed' || booking.status === 'Declined' || booking.status === 'Pending Approval');
                    const isConfirmed = booking?.status === 'Confirmed';
                    const isManualBlock = booking?.customerName === 'Facility Block' || booking?.status === 'Declined';
                    const isPending = booking?.status === 'Pending Approval';

                    const isFullCourt = booking?.courtType === 'Full Court';

                    // Visuals
                    let bgClass = 'hover:bg-primary/5';
                    let borderClass = 'border-l border-border-dark';
                    let textClass = 'text-slate-500';
                    let borderColor = '';

                    if (isOccupied) {
                      if (isFullCourt) {
                        bgClass = isConfirmed ? 'bg-green-500/20' : isPending ? 'bg-orange-500/20' : 'bg-red-500/20';
                        textClass = isConfirmed ? 'text-green-600' : isPending ? 'text-orange-500' : 'text-red-500';
                        borderColor = isConfirmed ? 'border-green-500/30' : isPending ? 'border-orange-500/30' : 'border-red-500/30';
                      } else {
                        bgClass = isConfirmed ? 'bg-blue-500/20' : isPending ? 'bg-blue-300/20' : 'bg-blue-500/10';
                        textClass = 'text-blue-500';
                        borderColor = 'border-blue-500/30';
                      }
                    }

                    return (
                      <div
                        key={dIdx}
                        onClick={() => handleBlockSlot(dIdx, hIdx)}
                        className={`${borderClass} relative group transition-all cursor-pointer overflow-hidden ${bgClass}`}
                      >
                        {isOccupied && (
                          <div
                            className={`absolute inset-1 border border-dashed rounded flex flex-col items-center justify-center opacity-90 p-1 ${borderColor} ${textClass}`}
                            title={isManualBlock ? 'Facility Block' : `${booking.customerName}\n${booking.email}\n${booking.courtType}`}
                          >
                            <span className="text-[9px] font-black uppercase tracking-tight text-center leading-none truncate w-full">
                              {isManualBlock ? 'BLOCKED' : booking.customerName || 'Guest'}
                            </span>
                            {!isManualBlock && (
                              <span className="text-[6px] font-bold uppercase tracking-widest opacity-75 mt-0.5">
                                {booking.courtType === 'Full Court' ? 'FULL' : 'HALF'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {showBlockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowBlockModal(false)}></div>
          <div className="relative bg-card-dark border border-border-dark w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-border-dark flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Block Facility Time</h3>
                <p className="text-xs text-slate-500 font-bold uppercase mt-1">Manual availability override</p>
              </div>
              <button onClick={() => setShowBlockModal(false)} className="size-10 rounded-full border border-border-dark flex items-center justify-center hover:bg-white/5">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 block">Reason for Closure</label>
                <select className="w-full bg-background-dark border-border-dark rounded-xl h-14 px-4 text-white font-bold outline-none focus:ring-2 focus:ring-primary">
                  <option>Repeated Booking</option>
                  <option>Maintenance & Cleaning</option>
                  <option>Private Event</option>
                  <option>Team Practice Only</option>
                  <option>Holiday Closure</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 block">Recurrence</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setRecurrence('One-Time')}
                    className={`h-14 border-2 rounded-xl font-bold uppercase text-[10px] tracking-tight transition-all ${recurrence === 'One-Time' ? 'border-primary bg-primary/10 text-white' : 'border-border-dark bg-card-dark text-slate-500'}`}>
                    One Time
                  </button>
                  <button
                    onClick={() => setRecurrence('Weekly')}
                    className={`h-14 border-2 rounded-xl font-bold uppercase text-[10px] tracking-tight transition-all ${recurrence === 'Weekly' ? 'border-primary bg-primary/10 text-white' : 'border-border-dark bg-card-dark text-slate-500'}`}>
                    Weekly
                  </button>
                  <button
                    onClick={() => setRecurrence('Monthly')}
                    className={`h-14 border-2 rounded-xl font-bold uppercase text-[10px] tracking-tight transition-all ${recurrence === 'Monthly' ? 'border-primary bg-primary/10 text-white' : 'border-border-dark bg-card-dark text-slate-500'}`}>
                    Monthly
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 block">Court Scope</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBlockScope('Full Court')}
                    className={`h-14 border-2 rounded-xl font-bold uppercase text-[10px] tracking-tight transition-all ${blockScope === 'Full Court' ? 'border-red-500 bg-red-500/10 text-white' : 'border-border-dark bg-card-dark text-slate-500'}`}>
                    Block Full Court
                  </button>
                  <button
                    onClick={() => setBlockScope('Half Court')}
                    className={`h-14 border-2 rounded-xl font-bold uppercase text-[10px] tracking-tight transition-all ${blockScope === 'Half Court' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-border-dark bg-card-dark text-slate-500'}`}>
                    Block Half Court
                  </button>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <span className="material-symbols-outlined text-sm">info</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Instruction</span>
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Tap the 30-min slots directly on the schedule grid after setting your policy.
                  Recurrence: <span className="text-primary font-bold lowercase">{recurrence}</span>.
                </p>
              </div>
            </div>

            <div className="p-8 bg-background-dark/50 border-t border-border-dark">
              <button
                onClick={() => setShowBlockModal(false)}
                className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-orange-600 transition-all text-left"
              >
                Confirm Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchedule;
