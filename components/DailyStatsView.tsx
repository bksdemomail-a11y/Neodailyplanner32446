
import React, { useState, useMemo } from 'react';
import { DailyRoutine } from '../types';
import { Icons } from '../constants';

interface DailyStatsViewProps {
  allRoutines: Record<string, DailyRoutine>;
  activeDate: Date;
  onBack: () => void;
}

type RangeType = 'TODAY' | '7D' | '30D' | '1Y' | '2Y' | '5Y';

const DailyStatsView: React.FC<DailyStatsViewProps> = ({ allRoutines, activeDate, onBack }) => {
  const [range, setRange] = useState<RangeType>('TODAY');

  const analytics = useMemo(() => {
    const todayStr = activeDate.toISOString().split('T')[0];
    const routinesArr = Object.values(allRoutines);
    
    // Get time bounds
    const now = new Date();
    const getDaysAgo = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d;
    };

    let targetRoutines: DailyRoutine[] = [];
    let prevRoutines: DailyRoutine[] = [];

    if (range === 'TODAY') {
      targetRoutines = routinesArr.filter(r => r.date === todayStr);
      // For comparison, get average of last 7 days
      prevRoutines = routinesArr.filter(r => {
        const d = new Date(r.date);
        return d < activeDate && d >= getDaysAgo(7);
      });
    } else {
      const days = range === '7D' ? 7 : range === '30D' ? 30 : range === '1Y' ? 365 : range === '2Y' ? 730 : 1825;
      const start = getDaysAgo(days);
      const prevStart = getDaysAgo(days * 2);
      
      targetRoutines = routinesArr.filter(r => new Date(r.date) >= start);
      prevRoutines = routinesArr.filter(r => {
        const d = new Date(r.date);
        return d >= prevStart && d < start;
      });
    }

    const calculateExecution = (list: DailyRoutine[]) => {
      let total = 0;
      let completed = 0;
      let totalHours = 0;
      let completedHours = 0;

      list.forEach(r => {
        if (r.tasks) {
          total += r.tasks.length;
          completed += r.tasks.filter(t => t.completed).length;
          r.tasks.forEach(t => {
            const dur = t.endTime - t.startTime;
            totalHours += dur;
            if (t.completed) completedHours += dur;
          });
        }
      });

      return {
        rate: total > 0 ? (completed / total) * 100 : 0,
        hours: completedHours,
        volatility: total > 0 ? completed / total : 0
      };
    };

    const currentStats = calculateExecution(targetRoutines);
    const prevStats = calculateExecution(prevRoutines);
    const momentum = currentStats.rate - prevStats.rate;

    // Generate Graph Data (Crypto Style Trend)
    const points: number[] = [];
    const daysToMap = range === 'TODAY' ? 24 : range === '7D' ? 7 : range === '30D' ? 30 : 50; // Cap long ranges for visual
    
    if (range === 'TODAY') {
      const r = targetRoutines[0];
      for (let i = 0; i <= 24; i++) {
        const completedAtThisHour = r?.tasks?.filter(t => t.completed && t.endTime <= i).length || 0;
        points.push(r?.tasks?.length ? (completedAtThisHour / r.tasks.length) : 0);
      }
    } else {
      for (let i = daysToMap; i >= 0; i--) {
        const d = getDaysAgo(i).toISOString().split('T')[0];
        const r = allRoutines[d];
        const rate = r?.tasks?.length ? (r.tasks.filter(t => t.completed).length / r.tasks.length) : 0;
        points.push(rate);
      }
    }

    return { ...currentStats, momentum, points, targetRoutines };
  }, [allRoutines, activeDate, range]);

  const isPositive = analytics.momentum >= 0;
  const graphColor = isPositive ? '#10b981' : '#f43f5e';

  const renderSparkline = () => {
    const width = 800;
    const height = 200;
    const padding = 20;
    const data = analytics.points;

    if (data.length < 2) return (
      <div className="h-full flex items-center justify-center text-slate-700 font-black uppercase tracking-[0.4em] text-[10px]">
        Insufficient Temporal Data
      </div>
    );

    const pointsString = data.map((val, i) => {
      const x = padding + (i * (width - 2 * padding) / (data.length - 1));
      const y = (height - padding) - (val * (height - 2 * padding));
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chart-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={graphColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={graphColor} stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path d={`M ${padding},${height-padding} L ${pointsString} L ${width-padding},${height-padding} Z`} fill="url(#chart-grad)" className="transition-all duration-1000" />
        <polyline fill="none" stroke={graphColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={pointsString} filter="url(#glow)" className="transition-all duration-1000" />
      </svg>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 h-full overflow-y-auto no-scrollbar pb-32 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Live Market: Execution</span>
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter leading-none">Momentum Terminal</h2>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-3xl overflow-x-auto no-scrollbar">
          {(['TODAY', '7D', '30D', '1Y', '2Y', '5Y'] as RangeType[]).map(r => (
            <button 
              key={r} 
              onClick={() => setRange(r)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${range === r ? 'bg-white text-slate-950 shadow-xl scale-105' : 'text-slate-500 hover:text-white'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
        <div className="lg:col-span-3 bg-slate-900/60 backdrop-blur-3xl rounded-[3.5rem] border border-white/5 p-10 relative overflow-hidden group">
          <div className="absolute top-10 right-10 flex flex-col items-end">
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Productivity</div>
             <div className="text-4xl font-black text-white tracking-tighter tabular-nums">{analytics.hours.toFixed(1)} <span className="text-xl text-slate-600">HRS</span></div>
          </div>
          
          <div className="mb-16">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 block">Performance Pulse</span>
            <div className="flex items-baseline gap-4">
              <span className="text-7xl font-black text-white tracking-tighter tabular-nums">{analytics.rate.toFixed(1)}%</span>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {isPositive ? '+' : ''}{analytics.momentum.toFixed(1)}% {isPositive ? 'UPRISE' : 'DECLINE'}
              </div>
            </div>
          </div>

          <div className="h-[240px] w-full mt-10">
            {renderSparkline()}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 hover:border-sky-500/30 transition-all flex flex-col justify-between h-1/2">
             <div className="text-sky-400"><Icons.Sparkles /></div>
             <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Consistency Score</div>
                <div className="text-3xl font-black text-white tabular-nums">{(analytics.rate * 0.85).toFixed(0)}</div>
             </div>
          </div>
          <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col justify-between h-1/2">
             <div className="text-emerald-400"><Icons.Check /></div>
             <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Targets Liquidated</div>
                <div className="text-3xl font-black text-white tabular-nums">
                  {analytics.targetRoutines.reduce((acc, r) => acc + (r.tasks?.filter(t => t.completed).length || 0), 0)}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Work Focus', val: '42%', icon: <Icons.Calendar />, color: 'text-sky-400' },
           { label: 'Health Index', val: '88%', icon: <Icons.Sun />, color: 'text-emerald-400' },
           { label: 'Social Volume', val: '12%', icon: <Icons.User />, color: 'text-amber-400' },
           { label: 'Rest Reserves', val: '75%', icon: <Icons.Moon />, color: 'text-indigo-400' }
         ].map((stat, i) => (
           <div key={i} className="bg-black/40 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between hover:bg-black/60 transition-all">
              <div className="flex items-center gap-4">
                 <div className={`p-3 bg-white/5 rounded-xl ${stat.color}`}>{stat.icon}</div>
                 <div>
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{stat.label}</div>
                    <div className="text-xl font-black text-white">{stat.val}</div>
                 </div>
              </div>
           </div>
         ))}
      </div>

      <div className="mt-12 flex justify-center">
        <button 
          onClick={onBack}
          className="px-10 py-4 bg-white/5 text-slate-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all border border-white/5"
        >
          Return to Hub
        </button>
      </div>
    </div>
  );
};

export default DailyStatsView;
