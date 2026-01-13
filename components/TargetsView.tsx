
import React, { useState, useMemo } from 'react';
import { Target, COLORS } from '../types';
import { Icons } from '../constants';

// Define the missing TargetsViewProps interface
interface TargetsViewProps {
  targets: Target[];
  onUpdateTargets: (newTargets: Target[]) => void;
}

const Sparkline: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
  if (data.length < 2) return <div className="h-14 flex items-center justify-center text-[11px] text-slate-700 italic font-black uppercase tracking-widest">Pending Data...</div>;

  const width = 300;
  const height = 60;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (val * height);
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div className="h-14 w-full mt-6 group/chart relative bg-black/20 rounded-xl overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline fill={`url(#grad-${color})`} points={areaPoints} />
        <polyline fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none opacity-0 group-hover/chart:opacity-100 transition-opacity">
        <span className="text-[9px] font-black text-slate-500 bg-black/60 px-2 py-1 rounded-lg uppercase tracking-widest">Start</span>
        <span className="text-[9px] font-black text-slate-500 bg-black/60 px-2 py-1 rounded-lg uppercase tracking-widest">Trend</span>
      </div>
    </div>
  );
};

// Fixed: The TargetsView component now has access to the TargetsViewProps interface.
const TargetsView: React.FC<TargetsViewProps> = ({ targets, onUpdateTargets }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDuration, setNewDuration] = useState('30');
  const [newColor, setNewColor] = useState(COLORS[0].hex);

  const addTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const target: Target = {
      id: crypto.randomUUID(),
      title: newTitle,
      description: newDescription,
      totalDays: parseInt(newDuration),
      startDate: new Date().toISOString().split('T')[0],
      completedDates: [],
      missedDates: [],
      color: newColor,
      isArchived: false
    };
    onUpdateTargets([...targets, target]);
    setIsAdding(false);
    setNewTitle('');
    setNewDescription('');
  };

  const toggleDayStatus = (targetId: string, status: 'complete' | 'miss') => {
    const today = new Date().toISOString().split('T')[0];
    const updated = targets.map(t => {
      if (t.id === targetId) {
        if (status === 'complete') {
          const isCompleted = t.completedDates.includes(today);
          const completedDates = isCompleted ? t.completedDates.filter(d => d !== today) : [...t.completedDates, today];
          return { ...t, completedDates, missedDates: t.missedDates.filter(d => d !== today) };
        } else {
          const isMissed = t.missedDates.includes(today);
          const missedDates = isMissed ? t.missedDates.filter(d => d !== today) : [...t.missedDates, today];
          return { ...t, missedDates, completedDates: t.completedDates.filter(d => d !== today) };
        }
      }
      return t;
    });
    onUpdateTargets(updated);
  };

  const calculateTargetInfo = (target: Target) => {
    const completed = target.completedDates.length;
    const progress = Math.min(100, Math.round((completed / target.totalDays) * 100));
    const startDate = new Date(target.startDate);
    const chartData: number[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const dayCount = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    let cumulative = 0;
    const set = new Set(target.completedDates);
    for (let i = 0; i < Math.max(7, dayCount); i++) {
      const cur = new Date(startDate);
      cur.setDate(startDate.getDate() + i);
      if (set.has(cur.toISOString().split('T')[0])) cumulative++;
      chartData.push(cumulative / target.totalDays);
    }
    return { completed, progress, chartData };
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 h-full overflow-y-auto no-scrollbar pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">Focus Missions</h2>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[11px]">Consistent effort builds lasting change</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
            <button onClick={() => setFilter('active')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${filter === 'active' ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-white'}`}>Active</button>
            <button onClick={() => setFilter('archived')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${filter === 'archived' ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-white'}`}>Archive</button>
          </div>
          {filter === 'active' && (
            <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-8 py-4 bg-sky-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-sky-500 shadow-3xl transition-all">
              <Icons.Plus /> Create Mission
            </button>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="mb-12 bg-slate-900/60 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-4xl animate-in zoom-in-95 duration-300">
          <form onSubmit={addTarget} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Mission Name</label>
                  <input autoFocus required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Read 30 mins..." className="w-full px-6 py-4 bg-black/40 border border-white/5 text-white rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none font-bold text-lg" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Context</label>
                  <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Why does this matter?..." rows={3} className="w-full px-6 py-4 bg-black/40 border border-white/5 text-white rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none font-medium resize-none" />
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Duration</label>
                  <select value={newDuration} onChange={e => setNewDuration(e.target.value)} className="w-full px-6 py-4 bg-black/40 border border-white/5 text-white rounded-2xl outline-none font-bold">
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days</option>
                    <option value="365">1 Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Identity Color</label>
                  <div className="flex flex-wrap gap-4">
                    {COLORS.map(c => (
                      <button key={c.hex} type="button" onClick={() => setNewColor(c.hex)} className={`w-11 h-11 rounded-full border-4 transition-all ${c.bg} ${newColor === c.hex ? 'ring-8 ring-white/5 border-white scale-110 shadow-3xl' : 'border-transparent opacity-40'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="submit" className="flex-grow py-5 bg-sky-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-3xl hover:bg-sky-500 transition-all">Launch Challenge</button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-10 py-5 bg-white/5 text-slate-400 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-white/10 transition-all">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {targets.filter(t => filter === 'active' ? !t.isArchived : t.isArchived).map(target => {
          const info = calculateTargetInfo(target);
          const today = new Date().toISOString().split('T')[0];
          const isDone = target.completedDates.includes(today);
          const isMiss = target.missedDates.includes(today);
          const color = COLORS.find(c => c.hex === target.color) || COLORS[0];
          return (
            <div key={target.id} className="bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-white/5 shadow-3xl overflow-hidden group">
              <div className="p-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex-grow">
                    <h3 className="text-3xl font-black text-white tracking-tighter leading-none">{target.title}</h3>
                    <div className="flex items-center gap-3 mt-5">
                      <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 uppercase tracking-[0.2em] text-[10px] font-black text-slate-400">Goal: {target.totalDays}d</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setDeletingId(target.id)} className="p-3 text-slate-600 hover:text-rose-500 transition-colors bg-white/5 rounded-2xl"><Icons.Trash /></button>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Progress</span>
                      <span className="text-3xl font-black text-white">{info.completed} / {target.totalDays}</span>
                    </div>
                    <div className="text-right">
                       <span className={`text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${color.bg} text-white shadow-2xl`}>{info.progress}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-black/40 rounded-full border border-white/5 overflow-hidden">
                    <div style={{ width: `${info.progress}%` }} className={`h-full ${color.bg} transition-all duration-1000 shadow-[0_0_15px_${color.hex}]`} />
                  </div>
                  <Sparkline data={info.chartData} color={color.hex} />
                  
                  {!target.isArchived && (
                    <div className="grid grid-cols-2 gap-5 mt-10">
                      <button onClick={() => toggleDayStatus(target.id, 'complete')} className={`flex items-center justify-center gap-3 py-5 rounded-3xl border-2 transition-all font-black uppercase text-[11px] tracking-[0.1em] ${isDone ? 'bg-emerald-600 border-emerald-500 text-white shadow-3xl' : 'bg-black/20 border-white/5 text-slate-500 hover:border-emerald-600/40 hover:text-emerald-400'}`}>
                        <Icons.Check /> {isDone ? 'Accomplished' : 'Success Today'}
                      </button>
                      <button onClick={() => toggleDayStatus(target.id, 'miss')} className={`flex items-center justify-center gap-3 py-5 rounded-3xl border-2 transition-all font-black uppercase text-[11px] tracking-[0.1em] ${isMiss ? 'bg-rose-600 border-rose-500 text-white shadow-3xl' : 'bg-black/20 border-white/5 text-slate-500 hover:border-rose-600/40 hover:text-rose-400'}`}>
                        Missed Today
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TargetsView;
