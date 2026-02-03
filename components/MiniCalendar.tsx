import React, { useState } from 'react';

interface MiniCalendarProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    onClose: () => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ selectedDate, onSelectDate, onClose }) => {
    // Navigation State (independent of selection)
    const [viewDate, setViewDate] = useState(new Date(selectedDate));

    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const months = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setViewDate(newDate);
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setViewDate(newDate);
    };

    const handleDayClick = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onSelectDate(newDate);
        onClose();
    };

    const renderDays = () => {
        const days = [];
        const daysInMonth = getDaysInMonth(viewDate);
        const firstDay = getFirstDayOfMonth(viewDate);
        const today = new Date();

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const isSelected =
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === viewDate.getMonth() &&
                selectedDate.getFullYear() === viewDate.getFullYear();

            const isToday =
                today.getDate() === day &&
                today.getMonth() === viewDate.getMonth() &&
                today.getFullYear() === viewDate.getFullYear();

            days.push(
                <button
                    key={day}
                    onClick={(e) => { e.stopPropagation(); handleDayClick(day); }}
                    className={`
            h-9 w-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all
            ${isSelected ? 'bg-[#FF8C00] text-white shadow-lg shadow-orange-500/20 scale-110' : 'text-slate-300 hover:bg-white/10'}
            ${!isSelected && isToday ? 'text-[#FF8C00]' : ''}
          `}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    return (
        <div
            className="absolute top-12 left-0 z-50 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-5 w-[320px] animate-in zoom-in-95 duration-200 select-none"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="mb-6">
                <h4 className="text-[#FF8C00] text-[10px] font-black tracking-[0.2em] mb-3 uppercase">Select Date</h4>
                <div className="flex items-center justify-between">
                    <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-white text-xl font-black italic tracking-tight uppercase">
                            {months[viewDate.getMonth()]}
                        </span>
                        <span className="text-[#FF8C00] text-base font-black italic tracking-tight">
                            {viewDate.getFullYear()}
                        </span>
                    </div>
                    <button onClick={handleNextMonth} className="text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 place-items-center">
                {daysOfWeek.map(day => (
                    <div key={day} className="h-8 w-8 flex items-center justify-center text-[10px] font-bold text-slate-500 mb-2">
                        {day}
                    </div>
                ))}
                {renderDays()}
            </div>
        </div>
    );
};

export default MiniCalendar;
