// Force redeploy for Vercel
import React, { useState, useEffect } from 'react';
import { api } from '../src/api';
import { CourtType } from '../types';
import MiniCalendar from '../components/MiniCalendar';

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
  const [showCalendar, setShowCalendar] = useState(false); // Mini Calendar visibility state

  // Edit Block Modal State
  const [editingBlock, setEditingBlock] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [showDeleteOptions, setShowDeleteOptions] = useState(false); // Toggle for single vs series delete UI
  const [showUpdateOptions, setShowUpdateOptions] = useState(false); // Toggle for single vs series update UI

  // Color Palette
  const COLORS = [
    { label: 'Gray', value: '#3f3f46' }, // Zinc 700
    { label: 'Red', value: '#ef4444' }, // Red 500
    { label: 'Orange', value: '#f97316' }, // Orange 500
    { label: 'Amber', value: '#f59e0b' }, // Amber 500
    { label: 'Green', value: '#22c55e' }, // Green 500
    { label: 'Blue', value: '#3b82f6' }, // Blue 500
    { label: 'Indigo', value: '#6366f1' }, // Indigo 500
    { label: 'Purple', value: '#a855f7' }, // Purple 500
    { label: 'Pink', value: '#ec4899' }, // Pink 500
  ];
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [editColor, setEditColor] = useState(COLORS[0].value);

  // Multi-Select State

  const [selectedSlots, setSelectedSlots] = useState<string[]>([]); // Format: "YYYY-MM-DD|HH:mm PM"

  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number, hour: number, min: number } | null>(null);

  // Store full booking objects now, not just indices
  const [bookings, setBookings] = useState<any[]>([]);

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

    // Fetch data for the surrounding period (e.g., +/- 4 weeks)
    // To ensure smooth navigation, we fetch a 3-month window centered on the current week
    const fetchStart = new Date(currentWeekStart);
    fetchStart.setMonth(fetchStart.getMonth() - 2); // -2 months

    const fetchEnd = new Date(currentWeekStart);
    fetchEnd.setMonth(fetchEnd.getMonth() + 2); // +2 months

    const y1 = fetchStart.getFullYear(), m1 = String(fetchStart.getMonth() + 1).padStart(2, '0'), d1 = String(fetchStart.getDate()).padStart(2, '0');
    const y2 = fetchEnd.getFullYear(), m2 = String(fetchEnd.getMonth() + 1).padStart(2, '0'), d2 = String(fetchEnd.getDate()).padStart(2, '0');

    loadSchedule(`${y1}-${m1}-${d1}`, `${y2}-${m2}-${d2}`);
  }, [currentWeekStart]);

  const loadSchedule = async (start?: string, end?: string) => {
    try {
      if (!start || !end) {
        // Recalculate range based on currentWeekStart if not provided
        // This is crucial for re-fetching after updates (like creating blocks)
        const fetchStart = new Date(currentWeekStart);
        fetchStart.setMonth(fetchStart.getMonth() - 2);

        const fetchEnd = new Date(currentWeekStart);
        fetchEnd.setMonth(fetchEnd.getMonth() + 2);

        const y1 = fetchStart.getFullYear(), m1 = String(fetchStart.getMonth() + 1).padStart(2, '0'), d1 = String(fetchStart.getDate()).padStart(2, '0');
        const y2 = fetchEnd.getFullYear(), m2 = String(fetchEnd.getMonth() + 1).padStart(2, '0'), d2 = String(fetchEnd.getDate()).padStart(2, '0');

        start = `${y1}-${m1}-${d1}`;
        end = `${y2}-${m2}-${d2}`;
      }

      const data = await api.getBookings(start, end);
      setBookings(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Generate hours 6-23 (numbers)
  const hourRows = Array.from({ length: 18 }, (_, i) => 6 + i);

  // Generate the 7 days headers based on currentWeekStart
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayNum = d.getDate();
    return `${dayName} ${dayNum}`;
  });

  // Helper to map grid index to DateTime
  const getSlotDateTime = (dayIdx: number, hour: number, min: number) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + dayIdx);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Construct time string
    let displayHour = hour > 12 ? hour - 12 : hour;
    let period = hour >= 12 ? "PM" : "AM";
    const minStr = min === 0 ? '00' : '30';
    const timeStr = `${displayHour.toString().padStart(2, '0')}:${minStr} ${period}`;

    return { date: dateStr, time: timeStr };
  };


  const handleBlockSlot = async (dayIdx: number, hour: number, min: number) => {
    const { date, time } = getSlotDateTime(dayIdx, hour, min);

    // Handles Multi-Select Mode (Now Default)
    const slotKey = `${date}|${time}`;
    if (selectedSlots.includes(slotKey)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slotKey));
    } else {
      setSelectedSlots([...selectedSlots, slotKey]);
    }
    return;

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
      if (existing.status === 'Declined') {
        setEditingBlock(existing);
        setEditName(existing.customerName || '');
        setEditColor(existing.color || COLORS[0].value);
        setShowDeleteOptions(false); // Reset
        setShowUpdateOptions(false); // Reset
        return;
      }
    } else {
      // Create Block-Open Modal instead of prompt to allow color selection
      const slotKey = `${date}|${time}`;
      setSelectedSlots([slotKey]);
      setShowBlockModal(true);
    }
  };

  const handleConfirmSelection = async () => {
    if (selectedSlots.length === 0) return;

    // Use label from modal input, default to "Facility Block" if empty
    const finalBlockName = blockLabel || "Facility Block";
    // Optional: Validate if they really want to proceed without a specific name?
    // But "Facility Block" is a fine default.

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
              customerName: finalBlockName,
              email: 'admin@internal',
              courtType: blockScope,
              date: dateStr,
              time: slotTime,
              status: 'Declined',
              price: 0,
              waiverSigned: true,
              recurringGroupId: (recurrence !== 'Does not repeat') ? groupId : undefined,
              color: selectedColor
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
          // FIX: Create new Date object to avoid reference issues if date was not mutated correctly above (though setDate mutates in place)
          // However, to be safe and clear:
          currentDate = new Date(currentDate);
        }
      }

      await api.createBookingsBulk(bookingsBatch);
      await loadSchedule();
      setSelectedSlots([]);

      setShowBlockModal(false); // Close modal after confirming
      alert(`Successfully blocked ${selectedSlots.length} slots${repeats > 1 ? ` with ${recurrence} recurrence` : ''}.`);
    } catch (e: any) {
      console.error(e);
      alert(`Failed to block selected slots: ${e.message}`);
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

  const handleUpdateSeries = async (mode: 'future' | 'all') => {
    if (!editingBlock || !editingBlock.recurringGroupId) return;

    try {
      await api.updateBookingSeries(
        editingBlock.recurringGroupId,
        {
          customerName: editName,
          color: editColor
        },
        mode,
        editingBlock.date // Pass current date for 'future' mode
      );

      setEditingBlock(null);
      setShowUpdateOptions(false);
      await loadSchedule();
    } catch (e) {
      console.error(e);
      alert("Failed to update series");
    }
  };

  // Drag Handlers
  // Drag Handlers
  const handleSlotMouseDown = (dayIdx: number, hour: number, min: number) => {
    // Start new selection or add to existing if cmd/ctrl pressed? 
    // For GCal style: clicking starts a new selection block.
    setIsDragging(true);
    setDragStart({ day: dayIdx, hour, min });
    const { date, time } = getSlotDateTime(dayIdx, hour, min);
    const slotKey = `${date}|${time}`;
    // Clear previous if starting new drag (unless we want additive? GCal is usually new)
    // Actually GCal creates a new event. We are selecting slots to create a block.
    // Let's clear previous selection on mouse down to start fresh range.
    setSelectedSlots([slotKey]);
  };

  const handleSlotMouseEnter = (dayIdx: number, hour: number, min: number) => {
    if (!isDragging || !dragStart) return;

    // Drag-to-paint logic
    const { date, time } = getSlotDateTime(dayIdx, hour, min);
    const slotKey = `${date}|${time}`;
    if (!selectedSlots.includes(slotKey)) {
      setSelectedSlots([...selectedSlots, slotKey]);
    }
  };


  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    if (selectedSlots.length > 0) {
      setShowBlockModal(true);
    }
  };

  const handleRename = async () => {
    if (!editingBlock) return;
    const hasNameChange = editName && editName !== editingBlock.customerName;
    const hasColorChange = editColor && editColor !== editingBlock.color;

    if (hasNameChange || hasColorChange) {
      // Check if it's a recurring series
      if (editingBlock.recurringGroupId) {
        setShowUpdateOptions(true);
        return;
      }

      try {
        await api.updateBookingDetails(editingBlock.id, {
          customerName: editName,
          color: editColor
        });
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
            <div className="flex bg-[#1E1E1E] dark:bg-card-dark rounded-xl p-1.5 gap-1 border border-white/5 shadow-inner relative">
              {/* Date Navigator with MiniCalendar Poptop */}
              <div className="relative z-50">
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all border border-transparent hover:border-white/10 active:scale-95"
                >
                  <span className="material-symbols-outlined text-slate-400">calendar_month</span>
                  <span className="font-bold text-sm tracking-wide font-manrope">{selectedWeek}</span>
                  <span className="material-symbols-outlined text-slate-500 text-sm">arrow_drop_down</span>
                </button>

                {showCalendar && (
                  <MiniCalendar
                    selectedDate={currentWeekStart}
                    onSelectDate={(date) => {
                      // Adjust to Monday
                      const day = date.getDay();
                      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                      const newStart = new Date(date);
                      newStart.setDate(diff);
                      setCurrentWeekStart(newStart);
                      setShowCalendar(false);
                    }}
                    onClose={() => setShowCalendar(false)}
                  />
                )}
              </div>

              <div className="w-px bg-white/10 mx-1"></div>

              <button
                onClick={() => {
                  const d = new Date(currentWeekStart);
                  d.setDate(d.getDate() - 7);
                  setCurrentWeekStart(d);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>

              <button
                onClick={() => {
                  const d = new Date(currentWeekStart);
                  d.setDate(d.getDate() + 7);
                  setCurrentWeekStart(d);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowBlockModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-600/20 hover:scale-105 transition-all"
            >
              <span className="material-symbols-outlined text-sm">settings</span>
              Block Settings
            </button>
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
              <div className="relative">
                {hourRows.map((hour) => {
                  let displayHour = hour > 12 ? hour - 12 : hour;
                  let period = hour >= 12 ? "PM" : "AM";
                  const label = `${displayHour}${period} `;

                  return (
                    <div key={hour} className="grid grid-cols-[100px_repeat(7,1fr)] h-24 border-b border-border-dark/50">
                      {/* Hour Label-Vertically centered or top aligned? Google uses top-0.5em */}
                      <div className="flex justify-center pt-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-border-dark relative">
                        <span className="-mt-3 bg-white dark:bg-card-dark px-1">{label}</span>
                      </div>

                      {days.map((_, dIdx) => (
                        <div key={dIdx} className="border-l border-border-dark flex flex-col h-full relative group-day">
                          {/* Loop for 00 and 30 */}
                          {[0, 30].map((min) => {
                            const { date, time } = getSlotDateTime(dIdx, hour, min);
                            const booking = bookings.find(b => b.date === date && b.time === time);

                            const isOccupied = booking && (booking.status === 'Confirmed' || booking.status === 'Declined' || booking.status === 'Pending Approval');
                            const isConfirmed = booking?.status === 'Confirmed';
                            const isManualBlock = booking?.customerName === 'Facility Block' || booking?.status === 'Declined';
                            const isPending = booking?.status === 'Pending Approval';
                            const isFullCourt = booking?.courtType === 'Full Court';

                            let bgClass = 'hover:bg-primary/5';
                            let borderClass = min === 0 ? 'border-b border-border-dark/10' : ''; // faint divider
                            let textClass = 'text-slate-500';
                            let borderColor = '';

                            // Fixed: Remove extra spaces in template literal
                            const isSelected = selectedSlots.includes(`${date}|${time}`);
                            if (isSelected) {
                              bgClass = 'bg-blue-500/30'; // GCal style blue
                              // borderColor = 'border-blue-500 border-2 border-dashed'; // Remove dashed border for cleaner look? Or keep?
                              // Let's keep a subtle border
                              borderColor = 'border-blue-500/50 border';
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

                              if (isManualBlock && booking.color) {
                                bgClass = ``;
                                textClass = `text-white`;
                                borderColor = `border-white / 20`;
                              }
                            }

                            return (
                              <div
                                key={min}
                                onMouseDown={() => {
                                  // Always handle slot mouse down for drag start
                                  handleSlotMouseDown(dIdx, hour, min);
                                }}
                                onMouseEnter={() => handleSlotMouseEnter(dIdx, hour, min)}

                                className={`flex-1 relative group w-full transition-all cursor-pointer overflow-hidden ${bgClass} ${borderClass} `}
                                style={isManualBlock && booking?.color ? { backgroundColor: booking.color } : {}}
                              >
                                {isOccupied && (
                                  <div
                                    className={`absolute inset-1 border border-dashed rounded flex flex-col items-center justify-center opacity-90 p-1 ${borderColor} ${textClass} `}
                                    title={isManualBlock ? booking.customerName : `${booking.customerName} \n${booking.email} \n${booking.courtType} `}
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
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main >

      {
        showBlockModal && (
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
                          : 'Select date'}
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
                      <option value="Weekly">
                        Weekly on {selectedSlots.length > 0 ? new Date(selectedSlots[0].split('|')[0] + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }) : 'Day'}
                      </option>
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
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors border ${blockScope === 'Full Court' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'} `}
                      >
                        Full Court
                      </button>
                      <button
                        onClick={() => setBlockScope('Half Court')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors border ${blockScope === 'Half Court' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'} `}
                      >
                        Half Court
                      </button>
                    </div>
                  </div>
                </div>

                {/* Color Picker (Create Modal) */}
                <div className="mt-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Block Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        title={c.label}
                        onClick={() => setSelectedColor(c.value)}
                        className={`size-8 rounded-full transition-transform hover: scale-110 ${selectedColor === c.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''} `}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
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
        )
      }

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
                {!showDeleteOptions && !showUpdateOptions ? (
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

                    {/* Color Picker (Edit Modal) */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">Block Color</label>
                      <div className="flex gap-2 flex-wrap">
                        {COLORS.map((c) => (
                          <button
                            key={c.value}
                            title={c.label}
                            onClick={() => setEditColor(c.value)}
                            className={`size-8 rounded-full transition-transform hover: scale-110 ${editColor === c.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''} `}
                            style={{ backgroundColor: c.value }}
                          />
                        ))}
                      </div>
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
                ) : showUpdateOptions ? (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                    <div className="flex items-center gap-3 mb-6 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 text-blue-400">
                      <span className="material-symbols-outlined text-2xl">update</span>
                      <div className="text-xs font-medium leading-relaxed">
                        This is a recurring event. <br />
                        How would you like to apply these changes?
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={async () => {
                          try {
                            await api.updateBookingDetails(editingBlock.id, {
                              customerName: editName,
                              color: editColor
                            });
                            setEditingBlock(null);
                            setShowUpdateOptions(false);
                            await loadSchedule();
                          } catch (e) {
                            console.error(e);
                            alert("Failed to update block");
                          }
                        }}
                        className="w-full h-12 bg-white text-slate-800 font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all text-xs"
                      >
                        This Event Only
                      </button>
                      <button
                        onClick={() => handleUpdateSeries('future')}
                        className="w-full h-12 bg-blue-600 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all text-xs"
                      >
                        This and Following Events
                      </button>
                      <button
                        onClick={() => handleUpdateSeries('all')}
                        className="w-full h-12 border-2 border-slate-700 text-slate-400 font-black uppercase tracking-widest rounded-xl hover:border-slate-500 hover:text-white transition-all text-xs"
                      >
                        All Events
                      </button>
                      <button
                        onClick={() => setShowUpdateOptions(false)}
                        className="w-full h-10 text-slate-500 font-bold uppercase tracking-widest hover:text-white transition-all text-[10px] mt-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
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
