import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  isPast
} from 'date-fns';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface CalendarPickerProps {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({ selectedDate, onSelect, onClear, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const selected = selectedDate ? new Date(selectedDate) : null;

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.02]">
        <div className="flex flex-col">
          <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
            {format(currentMonth, 'MMMM')}
          </span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">
            {format(currentMonth, 'yyyy')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentMonth(subMonths(currentMonth, 1)); }}
            className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/50 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentMonth(addMonths(currentMonth, 1)); }}
            className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/50 transition-colors"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return (
      <div className="grid grid-cols-7 mb-1">
        {days.map((day) => (
          <div key={day} className="text-center py-2">
            <span className="text-[10px] font-bold text-slate-300 dark:text-white/20 uppercase tracking-widest">
              {day}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-px p-1 bg-neutral-100 dark:bg-white/5">
        {days.map((day) => {
          const formattedDate = format(day, 'yyyy-MM-dd');
          const isSelected = selected && isSameDay(day, selected);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);
          const isPastDate = isPast(day) && !isTodayDate;

          return (
            <button
              key={formattedDate}
              onClick={(e) => { e.stopPropagation(); onSelect(formattedDate); }}
              className={`
                relative h-10 flex items-center justify-center text-xs font-bold transition-all rounded-lg
                ${!isCurrentMonth ? 'text-slate-200 dark:text-white/5' : 'text-slate-700 dark:text-white/80'}
                ${isSelected 
                  ? 'bg-lime-500 text-white shadow-lg shadow-lime-500/30 font-black scale-110 z-10' 
                  : isCurrentMonth ? 'bg-white dark:bg-[#1E1E20] hover:bg-neutral-100 dark:hover:bg-white/10' : 'bg-neutral-50 dark:bg-black/20'}
              `}
            >
              {isTodayDate && !isSelected && (
                <div className="absolute top-1 right-1 w-1 h-1 bg-lime-500 rounded-full"></div>
              )}
              {day.getDate()}
            </button>
          );
        })}
      </div>
    );
  };

  const renderFooter = () => {
    return (
      <div className="flex items-center justify-between p-3 border-t border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.02]">
        <button
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="px-3 py-1.5 text-[10px] font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg uppercase tracking-widest transition-colors"
        >
          Clear
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(format(new Date(), 'yyyy-MM-dd')); }}
          className="px-3 py-1.5 text-[10px] font-black text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-400/10 rounded-lg uppercase tracking-widest transition-colors"
        >
          Today
        </button>
      </div>
    );
  };

  return (
    <div 
      className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#2A2A2D] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {renderHeader()}
      <div className="p-1">
        {renderDays()}
        {renderCells()}
      </div>
      {renderFooter()}
    </div>
  );
};

export default CalendarPicker;
