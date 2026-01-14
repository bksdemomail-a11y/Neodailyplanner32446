
import React, { useState, useMemo } from 'react';
import { DailyRoutine, TimeBlock } from '../types';
import { Icons } from '../constants';
import Timeline from './Timeline';

interface HistoryViewProps {
  allRoutines: Record<string, DailyRoutine>;
  onSelectDate: (date: Date) => void;
  onAddTask: (date: Date, start: number, end: number) => void;
  onEditTask: (task: any) => void;
}

const ProductivityPulse: React.FC<{ allRoutines: Record<string, DailyRoutine> }> = ({ allRoutines }) => {
  const [range, setRange] = useState<7 | 30>(7);

  const data = useMemo(() => {
    const points: { date: string, hours: number }[] = [];
    const today = new Date();
    
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const routine = allRoutines[key];
      
      let productiveHours = 0;
      // Defensive check: routine or routine.tasks might be undefined/malformed
      if (routine && Array.isArray(routine.tasks)) {
        productiveHours = routine.tasks
          .filter(t => t && t.completed)
          .reduce((acc, t) => acc + (Math.abs(t.endTime - t.startTime) || 0), 0);
      }
      
      points.push({ 
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
        hours: productiveHours 
      });
    }
    return points;
  }, [allRoutines, range]);

  const maxHours = Math.max(...data.map(p => p.hours), 4);
  const width = 800;
  const height = 150;
  const padding = 20;

  const pointsString = data.map((p, i) => {
    const x = padding + (i * (width - 2 * padding) / (data.length - 1));
    const y = (height - padding) - (p.hours / maxHours * (height - 2 * padding));
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full bg-slate-950/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-8 mb-8 overflow-hidden relative group">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="text-[11px] font-black text-sky-400 uppercase tracking-[0.4em] mb-1">Temporal Momentum</h3>
          <p className="text-white text-lg font-black tracking-tighter">Consistency Log</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setRange(7)} 
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${range === 7 ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            7 Days
          </button>
          <button 
            onClick={() => setRange(30)} 
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${range === 30 ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="relative h-[150px] w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <filter id="ecg-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="line-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <line key={v} x1={padding} y1={padding + v * (height - 2 * padding)} x2={width - padding} y2={padding + v * (height - 2 * padding)} className="stroke-white/5" strokeWidth="1" />
          ))}

          <polyline points={`${padding},${height-padding} ${pointsString} ${width-padding},${height-padding}`} fill="url(#line-grad)" className="transition-all duration-1000" />
          <polyline fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pointsString} filter="url(#ecg-glow)" className="transition-all duration-1000" />
        </svg>
      </div>

      <div className="flex justify-between mt-4 px-2">
        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{data[0]?.date}</span>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Output Hours</span>
           </div>
        </div>
        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};

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
      
      const tasksArr = Array.isArray(routine?.tasks) ? routine.tasks : [];
      const taskCount = tasksArr.length;
      const completedCount = tasksArr.filter(t => t.completed).length;

      calendarDays.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`relative h-16 sm:h-20 p-2 rounded-2xl border transition-all hover:scale-105 active:scale-95 text-left flex flex-col justify-between group ${
            isSelected 
              ? 'border-sky-500 bg-sky-500/20 shadow-lg shadow-sky-500/10 z-10' 
              : isToday
              ? 'border-white/20 bg-white/5'
              : 'border-white/5 bg-slate-900/40 hover:bg-slate-800/60'
          }`}
        >
          <span className={`text-sm font-black ${isSelected || isToday ? 'text-white' : 'text-slate-500'}`}>{day}</span>
          <div className="flex flex-wrap gap-0.5 mt-auto">
             {[...Array(Math.min(taskCount, 8))].map((_, i) => (
               <div key={i} className={`w-1 h-1 rounded-full ${i < completedCount ? 'bg-sky-400 shadow-[0_0_3px_#38bdf8]' : 'bg-slate-700'}`} />
             ))}
          </div>
        </button>
      );
    }
    return calendarDays;
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 h-full flex flex-col overflow-hidden pb-32">
      <ProductivityPulse allRoutines={allRoutines} />

      <div className="flex flex-col lg:flex-row gap-8 overflow-hidden flex-grow">
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

        <div className="flex-grow bg-black/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">
          <div className="absolute top-8 left-8">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Snapshot</h3>
            <p className="text-xl font-black text-white tracking-tighter mt-1">{selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="w-full h-full max-h-[500px]">
            <Timeline 
              tasks={Array.isArray(currentRoutine.tasks) ? currentRoutine.tasks : []} 
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
    </div>
  );
};

export default HistoryView;
