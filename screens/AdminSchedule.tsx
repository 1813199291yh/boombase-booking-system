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
  const [recurrence, setRecurrence] = useState<'Does not repeat' | 'Daily' | 'Weekly' | 'Monthly' | 'Every weekday (Mon-Fri)' | 'Infinite'>('Does not repeat');
  const [blockScope, setBlockScope] = useState<CourtType>('Full Court');
  const [blockLabel, setBlockLabel] = useState(''); // Default empty for "Add title" placeholder behavior

  // Edit Block Modal State
  const [editingBlock, setEditingBlock] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [showDeleteOptions, setShowDeleteOptions] = useState(false); // Toggle for single vs series delete UI

  // Multi-Select State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]); // Format: "YYYY-MM-DD|HH:mm PM"

  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number, hour: number } | null>(null);

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

    // Handles Multi-Select Mode
    if (isSelectionMode) {
      const slotKey = `${date}|${time}`;
      if (selectedSlots.includes(slotKey)) {
        setSelectedSlots(selectedSlots.filter(s => s !== slotKey));
      } else {
        setSelectedSlots([...selectedSlots, slotKey]);
      }
      return;
    }

    const existing = bookings.find(b => b.date === date && b.time === time);



    if (existing && existing.status !== 'Cancelled' && existing.status !== 'Refunded') {
      if (existing.status === 'Confirmed') {
        alert("This slot is booked by a customer. Please reject/cancel it from the Dashboard first.");
        return;
      }
      if (existing.status === 'Pending Approval') {
        alert("This slot has a pending request. Please reject/approve it from the Dashboard first.");
        return;
      }

      // Handle Blocked Slot (Declined/Facility Block)
      // Handle Blocked Slot (Declined/Facility Block)
      if (existing.status === 'Declined') {
        setEditingBlock(existing);
        setEditName(existing.customerName || '');
        return;
      }
    } else {
      // Create Block - Ask for Name
      // Default to "Facility Block" but allow edit
      const blockName = window.prompt("Enter a label for this block:", blockLabel);

      if (!blockName) return; // User cancelled

      // Determine number of repeats
      let repeats = 1;
      if (recurrence === 'Weekly') repeats = 12; // 3 months approx
      if (recurrence === 'Monthly') repeats = 12; // 1 year

      try {
        const promises = [];
        const baseDate = new Date(date + 'T00:00:00'); // Ensure correct date parsing

        for (let i = 0; i < repeats; i++) {
          let targetDate = new Date(baseDate);

          if (recurrence === 'Weekly') {
            targetDate.setDate(baseDate.getDate() + (i * 7));
          } else if (recurrence === 'Monthly') {
            targetDate.setMonth(baseDate.getMonth() + i);
          }
          // For One-Time, i=0, so it stays baseDate

          // Format back to YYYY-MM-DD
          const y = targetDate.getFullYear();
          const m = String(targetDate.getMonth() + 1).padStart(2, '0');
          const d = String(targetDate.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;

          promises.push(api.createBooking({
            customerName: blockName,
            email: 'admin@internal',
            courtType: blockScope,
            date: dateStr,
            time: time,
            status: 'Declined', // Using 'Declined' as 'Block'
            price: 0,
            waiverSigned: true
          } as any));
        }

        await Promise.all(promises);
        await loadSchedule();
        alert(`Successfully created ${repeats} block(s).`);
      } catch (e) {
        console.error(e);
        alert("Failed to block slot(s)");
      }
    }
  };

  const handleConfirmSelection = async () => {
    if (selectedSlots.length === 0) return;

    // Ask for label one last time or use default
    const blockName = window.prompt(`Blocking ${selectedSlots.length} slots. Enter label:`, blockLabel);
    if (!blockName) return;

    // Determine number of repeats per slot
    let repeats = 1;
    if (recurrence === 'Daily') repeats = 365; // 1 year of daily
    if (recurrence === 'Every weekday (Mon-Fri)') repeats = 260; // 1 year of weekdays approx
    if (recurrence === 'Weekly') repeats = 52; // 1 year
    if (recurrence === 'Monthly') repeats = 12; // 1 year
    if (recurrence === 'Infinite') repeats = 156; // 3 years (52 * 3)

    // Generate Group ID (Simplified for compatibility)
    const groupId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    try {
      const bookingsBatch = [];

      for (const slotKey of selectedSlots) {
        const [slotDate, slotTime] = slotKey.split('|');
        const baseDate = new Date(slotDate + 'T00:00:00');

        // Efficient Loop for all types
        // We use a date cursor and count successful blocks
        let currentDate = new Date(baseDate);
        let count = 0;

        while (count < repeats) {
          // 1. Check if current date is valid for this recurrence
          let isValid = true;
          if (recurrence === 'Every weekday (Mon-Fri)') {
            const day = currentDate.getDay();
            if (day === 0 || day === 6) isValid = false;
          }

          // 2. If valid, add to batch
          if (isValid) {
            const y = currentDate.getFullYear();
            const m = String(currentDate.getMonth() + 1).padStart(2, '0');
            const d = String(currentDate.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;

            bookingsBatch.push({
              customerName: blockName || 'Closed',
              email: 'admin@internal',
              courtType: blockScope,
              date: dateStr,
              time: slotTime,
              status: 'Declined',
              price: 0,
              waiverSigned: true,
              recurringGroupId: (recurrence !== 'Does not repeat') ? groupId : undefined
            });

            count++;
          }

          // 3. Advance Date Cursor
          if (recurrence === 'Does not repeat') break;

          if (recurrence === 'Daily' || recurrence === 'Every weekday (Mon-Fri)') {
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (recurrence === 'Weekly' || recurrence === 'Infinite') {
            currentDate.setDate(currentDate.getDate() + 7);
          } else if (recurrence === 'Monthly') {
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
        }
      }

      await api.createBookingsBulk(bookingsBatch);
      await loadSchedule();
      setSelectedSlots([]);
      setIsSelectionMode(false);
      setShowBlockModal(false); // Close modal after confirming
      alert(`Successfully blocked ${selectedSlots.length} slots${repeats > 1 ? ` with ${recurrence} recurrence` : ''}.`);
    } catch (e) {
      console.error(e);
      alert("Failed to block selected slots");
    }
  };

  const handleUnblock = async () => {
    if (!editingBlock) return;

    // If it's a series, show the options instead of acting immediately
    if (editingBlock.recurringGroupId) {
      setShowDeleteOptions(true);
      return;
    }

    // Default single delete behavior
    try {
      await api.updateBookingStatus(editingBlock.id, 'Cancelled');
      setEditingBlock(null);
      await loadSchedule();
    } catch (e) {
      console.error(e);
      alert("Failed to unblock slot");
    }
  };

  const handleDeleteSeries = async () => {
    if (!editingBlock || !editingBlock.recurringGroupId) return;
    // Direct call now, no confirm needed here as UI will handle it
    try {
      await api.deleteBookingSeries(editingBlock.recurringGroupId);
      setEditingBlock(null);
      setShowDeleteOptions(false);
      await loadSchedule();
    } catch (e) {
      console.error(e);
      alert("Failed to delete series");
    }
  };

  const handleSingleDeleteFromSeries = async () => {
    if (!editingBlock) return;
    try {
      await api.updateBookingStatus(editingBlock.id, 'Cancelled');
      setEditingBlock(null);
      setShowDeleteOptions(false);
      await loadSchedule();
    } catch (e) {
      console.error(e);
      alert("Failed to unblock slot");
    }
  };

  // Drag Handlers
  const handleSlotMouseDown = (dayIdx: number, hourIdx: number) => {
    if (!isSelectionMode) return;
    setIsDragging(true);
    setDragStart({ day: dayIdx, hour: hourIdx });
    const { date, time } = getSlotDateTime(dayIdx, hourIdx);
    const slotKey = `${date}|${time}`;
    if (!selectedSlots.includes(slotKey)) {
      setSelectedSlots([...selectedSlots, slotKey]);
    }
  };

  const handleSlotMouseEnter = (dayIdx: number, hourIdx: number) => {
    if (!isSelectionMode || !isDragging || !dragStart) return;

    // Calculate range
    const minDay = Math.min(dragStart.day, dayIdx);
    const maxDay = Math.max(dragStart.day, dayIdx);
    const minHour = Math.min(dragStart.hour, hourIdx);
    const maxHour = Math.max(dragStart.hour, hourIdx); // Corrected property access

    const newSlots = new Set(selectedSlots);

    for (let d = minDay; d <= maxDay; d++) {
      for (let h = minHour; h <= maxHour; h++) {
        const { date, time } = getSlotDateTime(d, h);
        newSlots.add(`${date}|${time}`);
      }
    }
    setSelectedSlots(Array.from(newSlots));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleRename = async () => {
    if (!editingBlock) return;
    if (editName && editName !== editingBlock.customerName) {
      try {
        await api.updateBookingDetails(editingBlock.id, { customerName: editName });
        setEditingBlock(null);
        await loadSchedule();
      } catch (e) {
        console.error(e);
        alert("Failed to rename block");
      }
    } else {
      setEditingBlock(null);
    }
  };

  return (
    <div
      className="flex h-screen bg-slate-50 dark:bg-background-dark font-manrope overflow-hidden"
      onMouseUp={handleMouseUp}
    >
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
            {/* Multi-Select Toggle */}
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedSlots([]); // Clear on toggle
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${isSelectionMode ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20' : 'bg-white dark:bg-card-dark text-slate-500 border border-slate-200 dark:border-border-dark hover:border-primary hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-sm">{isSelectionMode ? 'check_box' : 'check_box_outline_blank'}</span>
              {isSelectionMode ? 'Multi-Select ON' : 'Multi-Select'}
            </button>

            {isSelectionMode && selectedSlots.length > 0 && (
              <button
                onClick={() => setShowBlockModal(true)} // Open modal to confirm selection
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-green-600/20 hover:scale-105 transition-all animate-in fade-in zoom-in duration-200"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                Confirm Block ({selectedSlots.length})
              </button>
            )}

            {!isSelectionMode && (
              <button
                onClick={() => setShowBlockModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-600/20 hover:scale-105 transition-all"
              >
                <span className="material-symbols-outlined text-sm">settings</span>
                Block Settings
              </button>
            )}
          </div>
        </header >

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

                    // Selection State
                    const isSelected = selectedSlots.includes(`${date}|${time}`);
                    if (isSelected) {
                      bgClass = 'bg-orange-500/20';
                      borderColor = 'border-orange-500 border-2 border-dashed';
                    }

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
                        onMouseDown={() => {
                          if (isSelectionMode) handleSlotMouseDown(dIdx, hIdx);
                          else handleBlockSlot(dIdx, hIdx);
                        }}
                        onMouseEnter={() => handleSlotMouseEnter(dIdx, hIdx)}
                        onClick={() => !isSelectionMode && handleBlockSlot(dIdx, hIdx)}
                        className={`${borderClass} relative group transition-all cursor-pointer overflow-hidden ${bgClass}`}
                      >
                        {isOccupied && (
                          <div
                            className={`absolute inset-1 border border-dashed rounded flex flex-col items-center justify-center opacity-90 p-1 ${borderColor} ${textClass}`}
                            title={isManualBlock ? booking.customerName : `${booking.customerName}\n${booking.email}\n${booking.courtType}`}
                          >
                            <span className="text-[9px] font-black uppercase tracking-tight text-center leading-none truncate w-full">
                              {booking.customerName || 'Guest'}
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
      </main >

      {showBlockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm" onClick={() => setShowBlockModal(false)}>
          <div
            className="relative bg-white dark:bg-card-dark w-full max-w-[500px] rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header / Title Input */}
            <div className="flex bg-slate-50 border-b border-border-dark px-4 py-2 justify-end">
              <button onClick={() => setShowBlockModal(false)} className="text-slate-400 hover:text-slate-700">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-6 pt-2">
              <input
                autoFocus
                value={blockLabel}
                onChange={(e) => setBlockLabel(e.target.value)}
                placeholder="Add title"
                className="w-full text-2xl font-normal border-b-2 border-slate-200 focus:border-blue-500 outline-none py-2 bg-transparent text-slate-800 dark:text-white placeholder:text-slate-400/80 transition-all font-manrope"
              />

              <div className="mt-6 flex flex-col gap-4">
                {/* Date/Time Row (Simplified Visual) */}
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="material-symbols-outlined text-slate-400">schedule</span>
                  <div>
                    <span className="font-medium mr-2">
                      {selectedSlots.length > 0
                        ? new Date(selectedSlots[0].split('|')[0]).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                        : 'Select date'
                      }
                    </span>
                    <span>• {selectedSlots.length} slots selected</span>
                  </div>
                </div>

                {/* Recurrence Dropdown */}
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 relative group">
                  <span className="material-symbols-outlined text-slate-400">repeat</span>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as any)}
                    className="appearance-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 rounded cursor-pointer outline-none font-medium pr-8 transition-colors"
                  >
                    <option value="Does not repeat">Does not repeat</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly on {new Date().toLocaleDateString('en-US', { weekday: 'long' })}</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Every weekday (Mon-Fri)">Every weekday (Mon-Fri)</option>
                    <option value="Infinite">Infinite (3 Years)</option>
                  </select>
                  <span className="material-symbols-outlined absolute left-[180px] pointer-events-none text-xs text-slate-500">arrow_drop_down</span>
                </div>

                {/* Court Scope */}
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="material-symbols-outlined text-slate-400">location_on</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBlockScope('Full Court')}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-colors border ${blockScope === 'Full Court' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                    >
                      Full Court
                    </button>
                    <button
                      onClick={() => setBlockScope('Half Court')}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-colors border ${blockScope === 'Half Court' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                    >
                      Half Court
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 flex justify-end gap-3 border-t border-slate-100 dark:border-border-dark mt-4">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                className="px-6 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-lg shadow-blue-500/20 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {
        editingBlock && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingBlock(null)}></div>
            <div className="relative bg-card-dark border border-border-dark w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-border-dark flex justify-between items-center bg-slate-50/5 dark:bg-card-dark">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Manage Block</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Edit label or remove block</p>
                </div>
                <button onClick={() => setEditingBlock(null)} className="size-8 rounded-full border border-border-dark flex items-center justify-center hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {!showDeleteOptions ? (
                  <>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">Block Label</label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. Maintenance"
                        className="w-full bg-background-dark border-border-dark rounded-xl h-12 px-4 text-white font-bold outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-600 text-sm"
                        autoFocus
                      />
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      <button
                        onClick={handleRename}
                        className="w-full h-12 bg-primary text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-orange-600 transition-all text-xs"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleUnblock}
                        className="w-full h-12 border-2 border-red-500/20 text-red-500 font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                        Delete
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                    <div className="flex items-center gap-3 mb-6 bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-red-400">
                      <span className="material-symbols-outlined text-2xl">warning</span>
                      <div className="text-xs font-medium leading-relaxed">
                        This is a recurring event. <br />
                        Would you like to delete just this instance or the entire series?
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleSingleDeleteFromSeries}
                        className="w-full h-12 bg-white text-slate-800 font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all text-xs"
                      >
                        Delete This Event Only
                      </button>
                      <button
                        onClick={handleDeleteSeries}
                        className="w-full h-12 bg-red-500 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all text-xs"
                      >
                        Delete All Events
                      </button>
                      <button
                        onClick={() => setShowDeleteOptions(false)}
                        className="w-full h-10 text-slate-500 font-bold uppercase tracking-widest hover:text-white transition-all text-[10px] mt-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AdminSchedule;
