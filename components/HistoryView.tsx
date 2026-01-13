
import React, { useState } from 'react';
import { DailyRoutine } from '../types';
import { Icons } from '../constants';
import Timeline from './Timeline';

interface HistoryViewProps {
  allRoutines: Record<string, DailyRoutine>;
  onSelectDate: (date: Date) => void;
  onAddTask: (date: Date, start: number, end: number) => void;
  onEditTask: (task: any) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ allRoutines, onSelectDate }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));

  const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

  const currentRoutine = allRoutines[formatDateKey(selectedDate)] || { date: formatDateKey(selectedDate), tasks: [] };

  const renderCalendar = () => {
    const totalDays = daysInMonth(currentYear, currentMonth);
    const offset = firstDayOfMonth(currentYear, currentMonth);
    const calendarDays = [];

    for (let i = 0; i < offset; i++) {
      calendarDays.push(<div key={`pad-${i}`} className="h-16 sm:h-20" />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = formatDateKey(date);
      const routine = allRoutines[dateStr];
      const isSelected = formatDateKey(selectedDate) === dateStr;
      const isToday = formatDateKey(new Date()) === dateStr;
      
      const taskCount = routine?.tasks.length || 0;

      calendarDays.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`relative h-16 sm:h-20 p-2 rounded-2xl border transition-all hover:scale-105 active:scale-95 text-left flex flex-col justify-between group ${
            isSelected 
              ? 'border-sky-500 bg-sky-500/20 shadow-lg shadow-sky-500/10 scale-105 z-10' 
              : isToday
              ? 'border-white/20 bg-white/5'
              : 'border-white/5 bg-slate-900/40 hover:bg-slate-800/60'
          }`}
        >
          <span className={`text-sm font-black ${isSelected || isToday ? 'text-white' : 'text-slate-500'}`}>{day}</span>
          {taskCount > 0 && (
            <div className="flex gap-0.5 mt-auto">
               {[...Array(Math.min(taskCount, 4))].map((_, i) => (
                 <div key={i} className="w-1 h-1 rounded-full bg-sky-500" />
               ))}
            </div>
          )}
        </button>
      );
    }
    return calendarDays;
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 h-full flex flex-col lg:flex-row gap-8 overflow-hidden">
      {/* Calendar Side */}
      <div className="flex-grow lg:max-w-xl overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Archive</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-1">Select a date to preview</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-white/5">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-white/5 rounded-xl text-slate-400"><Icons.ChevronLeft /></button>
            <span className="px-3 text-[10px] font-black text-white uppercase tracking-widest min-w-[100px] text-center">
              {viewDate.toLocaleString('default', { month: 'short' })} {currentYear}
            </span>
            <button onClick={handleNextMonth} className="p-2 hover:bg-white/5 rounded-xl text-slate-400"><Icons.ChevronRight /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="text-center pb-2 text-[9px] font-black text-slate-600 uppercase">{day}</div>
          ))}
          {renderCalendar()}
        </div>

        <button 
          onClick={() => onSelectDate(selectedDate)}
          className="w-full mt-8 py-4 bg-sky-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-3xl hover:bg-sky-500 transition-all flex items-center justify-center gap-3"
        >
          <Icons.Calendar /> Open in Full Planner
        </button>
      </div>

      {/* Clock Preview Side */}
      <div className="flex-grow bg-black/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">
         <div className="absolute top-8 left-8">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Day Preview</h3>
            <p className="text-xl font-black text-white tracking-tighter mt-1">{selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
         </div>
         <div className="w-full h-full max-h-[500px]">
            <Timeline 
              tasks={currentRoutine.tasks} 
              onAddTask={() => onSelectDate(selectedDate)} 
              onEditTask={() => onSelectDate(selectedDate)} 
              onDeleteTask={() => {}} 
              onToggleComplete={() => {}} 
              selectionStart={null} 
              setSelectionStart={() => {}} 
              isReadOnly={true}
            />
         </div>
      </div>
    </div>
  );
};

export default HistoryView;
