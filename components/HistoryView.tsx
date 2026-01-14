
import React, { useState, useMemo, useEffect } from 'react';
import { DailyRoutine, TimeBlock } from '../types';
import { Icons } from '../constants';
import Timeline from './Timeline';

interface HistoryViewProps {
  allRoutines: Record<string, DailyRoutine>;
  onUpdateRoutine: (routine: DailyRoutine) => void;
  onAddTask: (date: Date, start: number, end: number) => void;
  onEditTask: (date: Date, task: TimeBlock) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ allRoutines, onUpdateRoutine, onAddTask, onEditTask }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [noteInput, setNoteInput] = useState('');

  const formatDateKey = (date: Date) => date.toISOString().split('T')[0];
  const dateKey = formatDateKey(selectedDate);

  const currentRoutine = useMemo(() => {
    return allRoutines[dateKey] || { date: dateKey, tasks: [], notes: '', mediaLinks: [] };
  }, [allRoutines, dateKey]);

  useEffect(() => {
    setNoteInput(currentRoutine.notes || '');
  }, [currentRoutine.notes, dateKey]);

  const handleSaveNotes = () => {
    onUpdateRoutine({ ...currentRoutine, notes: noteInput });
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));

  const renderCalendar = () => {
    const totalDays = daysInMonth(currentYear, currentMonth);
    const offset = firstDayOfMonth(currentYear, currentMonth);
    const calendarDays = [];

    for (let i = 0; i < offset; i++) {
      calendarDays.push(<div key={`pad-${i}`} className="h-10 sm:h-14" />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = formatDateKey(date);
      const routine = allRoutines[dateStr];
      const isSelected = dateKey === dateStr;
      const isToday = formatDateKey(new Date()) === dateStr;
      
      const tasksArr = Array.isArray(routine?.tasks) ? routine.tasks : [];
      const hasContent = tasksArr.length > 0 || routine?.notes;

      calendarDays.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`relative h-10 sm:h-14 rounded-xl border transition-all flex flex-col justify-center items-center group ${
            isSelected 
              ? 'border-sky-500 bg-sky-500/20 z-10' 
              : isToday
              ? 'border-white/20 bg-white/5'
              : 'border-white/5 bg-slate-900/40 hover:bg-slate-800/60'
          }`}
        >
          <span className={`text-[11px] sm:text-xs font-black ${isSelected || isToday ? 'text-white' : 'text-slate-500'}`}>{day}</span>
          {hasContent && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-sky-400" />}
        </button>
      );
    }
    return calendarDays;
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 h-full flex flex-col overflow-y-auto no-scrollbar pb-40 animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white tracking-tighter">Life Archive</h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Reviewing: {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar: Calendar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-6">
            <div className="flex items-center justify-between mb-6 px-2">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex gap-1">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-white/5 rounded-lg text-slate-400"><Icons.ChevronLeft /></button>
                <button onClick={handleNextMonth} className="p-2 hover:bg-white/5 rounded-lg text-slate-400"><Icons.ChevronRight /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                <div key={day} className="text-center text-[8px] font-black text-slate-600 uppercase pb-2">{day}</div>
              ))}
              {renderCalendar()}
            </div>
          </div>
          
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem]">
             <h4 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Historical Context</h4>
             <p className="text-[11px] font-medium text-emerald-200/60 leading-relaxed">Changes made here are permanent to your personal timeline for this specific date.</p>
          </div>
        </div>

        {/* Main Review Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Schedule Section */}
          <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-6 sm:p-8 flex flex-col min-h-[450px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white tracking-tight uppercase tracking-widest">Temporal Routine</h3>
              <div className="flex gap-2">
                <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/5 text-[8px] font-black text-slate-500 uppercase tracking-widest">Editable</div>
              </div>
            </div>
            <div className="flex-grow relative h-[350px] sm:h-[400px]">
               <Timeline 
                tasks={currentRoutine.tasks} 
                onAddTask={(s, e) => onAddTask(selectedDate, s, e)} 
                onEditTask={(t) => onEditTask(selectedDate, t)} 
                onDeleteTask={() => {}} 
                onToggleComplete={() => {}} 
                selectionStart={null} 
                setSelectionStart={() => {}} 
              />
            </div>
          </div>

          {/* Reflection Section (Journal) */}
          <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-6 sm:p-10">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-black text-white tracking-tight uppercase tracking-widest">Day Reflection</h3>
               <button 
                 onClick={handleSaveNotes}
                 className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl transition-all"
               >
                 Commit Reflection
               </button>
            </div>
            <textarea 
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="What made this day unique? Growth, memories, and setbacks..."
              className="w-full bg-black/20 border border-white/5 rounded-2xl p-6 text-slate-100 text-sm sm:text-lg min-h-[250px] outline-none focus:ring-2 focus:ring-sky-500/30 transition-all resize-none font-medium leading-relaxed"
            />
            
            {currentRoutine.mediaLinks && currentRoutine.mediaLinks.length > 0 && (
              <div className="mt-8 pt-8 border-t border-white/5">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Linked Media</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {currentRoutine.mediaLinks.map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noreferrer" className="aspect-video bg-black/40 rounded-xl border border-white/5 flex items-center justify-center text-sky-400 hover:bg-sky-500/10 transition-all">
                      <Icons.Video />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
