import React, { useState } from 'react';

interface AppCalendarProps {
    selectedDate: string;
    onDateSelect: (date: string) => void;
    minDate?: string;
}

const AppCalendar: React.FC<AppCalendarProps> = ({ selectedDate, onDateSelect, minDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month); // 0 = Sun

    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptySlots = Array.from({ length: startDay }, (_, i) => i);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1));
    };

    const formatDate = (d: number) => {
        const m = String(month + 1).padStart(2, '0');
        const da = String(d).padStart(2, '0');
        return `${year}-${m}-${da}`;
    };

    const isPast = (d: number) => {
        if (!minDate) return false;
        const dateStr = formatDate(d);
        return dateStr < minDate;
    };

    const isSelected = (d: number) => formatDate(d) === selectedDate;

    return (
        <div className="bg-card-dark border border-border-dark rounded-xl p-6 w-full max-w-md select-none">
            <div className="flex justify-between items-center mb-6">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                    <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
                </button>
                <span className="text-lg font-black uppercase tracking-widest italic">{monthNames[month]} <span className="text-primary">{year}</span></span>
                <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                    <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                </button>
            </div>

            <div className="grid grid-cols-7 mb-2 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <div key={d} className="text-[10px] font-bold text-slate-500 uppercase">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {emptySlots.map(i => <div key={`empty-${i}`} />)}
                {daysArray.map(d => {
                    const disabled = isPast(d);
                    const selected = isSelected(d);
                    return (
                        <button
                            key={d}
                            onClick={() => !disabled && onDateSelect(formatDate(d))}
                            disabled={disabled}
                            className={`
                h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all
                ${selected
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                    : disabled
                                        ? 'text-slate-700 cursor-not-allowed'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }
              `}
                        >
                            {d}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default AppCalendar;
