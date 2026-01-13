
import React from 'react';
import { DailyRoutine, COLORS } from '../types';
import { Icons } from '../constants';

interface DailyStatsViewProps {
  routine: DailyRoutine;
  onBack: () => void;
}

const DailyStatsView: React.FC<DailyStatsViewProps> = ({ routine, onBack }) => {
  const tasks = routine.tasks;
  const completedTasks = tasks.filter(t => t.completed).length;
  const incompleteTasks = tasks.filter(t => !t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const totalDuration = tasks.reduce((acc, t) => acc + (t.endTime - t.startTime), 0);
  const completedDuration = tasks.filter(t => t.completed).reduce((acc, t) => acc + (t.endTime - t.startTime), 0);
  const durationRate = totalDuration > 0 ? Math.round((completedDuration / totalDuration) * 100) : 0;

  // Visual constants for 3D-like ring
  const strokeWidth = 15;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 h-full overflow-y-auto no-scrollbar pb-32 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Daily Momentum</h2>
          <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] mt-2">Quantitative Visual of {routine.date}</p>
        </div>
        <button onClick={onBack} className="p-4 bg-white/5 text-slate-400 rounded-2xl hover:text-white transition-all border border-white/5">
          <Icons.ChevronLeft />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* 3D Progress Ring */}
        <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-4xl flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent pointer-events-none" />
          
          <div className="relative w-64 h-64 mb-8">
            <svg className="w-full h-full -rotate-90 transform overflow-visible" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              {/* Outer Shadow Ring */}
              <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={strokeWidth + 4} />
              
              {/* Base Ring */}
              <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
              
              {/* Progress Ring with 3D Shadow and Glow */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="url(#ring-grad)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                filter="url(#ring-glow)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-black text-white tracking-tighter leading-none">{completionRate}%</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Executed</span>
            </div>
          </div>
          
          <div className="text-center">
             <div className="text-2xl font-black text-white leading-tight">{completedTasks} of {totalTasks}</div>
             <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1">Tasks finalized today</div>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] shadow-xl">
                <div className="text-sky-400 mb-4"><Icons.Chart /></div>
                <div className="text-3xl font-black text-white">{completedDuration.toFixed(1)}h</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Productive Hours Logged</div>
                <div className="mt-6 h-1 w-full bg-black/40 rounded-full overflow-hidden">
                   <div style={{ width: `${durationRate}%` }} className="h-full bg-sky-500 transition-all duration-1000" />
                </div>
             </div>
             
             <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] shadow-xl">
                <div className="text-emerald-400 mb-4 flex justify-between">
                   <Icons.Sparkles />
                   <div className="text-rose-500"><Icons.X /></div>
                </div>
                <div className="flex justify-between items-baseline mt-2">
                   <div className="text-3xl font-black text-white">{completedTasks} <span className="text-[10px] text-slate-500 uppercase">Complete</span></div>
                   <div className="text-xl font-black text-rose-500">{incompleteTasks} <span className="text-[10px] text-slate-600 uppercase">Incomplete</span></div>
                </div>
                <div className="mt-4 flex gap-1">
                   {[...Array(totalTasks)].map((_, i) => (
                     <div key={i} className={`h-2 w-full rounded-full ${i < completedTasks ? 'bg-emerald-500' : 'bg-rose-500/20'}`} />
                   ))}
                </div>
             </div>
          </div>

          <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 shadow-2xl">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-8">Detailed Execution Log</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
              {tasks.length > 0 ? tasks.map(task => {
                const color = COLORS.find(c => c.hex === task.color) || COLORS[0];
                return (
                  <div key={task.id} className="flex items-center gap-4 p-5 bg-black/20 rounded-[1.5rem] border border-white/5 group hover:bg-black/40 transition-all">
                    <div className={`w-3 h-3 rounded-full ${task.completed ? color.bg : 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.4)]'} ${task.completed ? 'shadow-[0_0_10px_' + color.hex + ']' : ''}`} />
                    <div className="flex-grow">
                       <h4 className={`text-sm font-black transition-all ${task.completed ? 'text-white' : 'text-slate-400'}`}>{task.title}</h4>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{task.category}</span>
                          <span className="text-[8px] font-bold text-slate-700">|</span>
                          <span className="text-[8px] font-bold text-slate-500">{(task.endTime - task.startTime).toFixed(1)}h</span>
                       </div>
                    </div>
                    {task.completed ? (
                       <div className="text-emerald-500 scale-125"><Icons.Check /></div>
                    ) : (
                       <div className="text-rose-500 scale-125"><Icons.X /></div>
                    )}
                  </div>
                );
              }) : (
                <div className="py-20 text-center opacity-20 flex flex-col items-center">
                   <Icons.Calendar />
                   <p className="text-xs font-black uppercase tracking-[0.3em] mt-4">No data to visualize yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyStatsView;
