
import React, { useState, useMemo } from 'react';
import { DailyRoutine } from '../types';
import { Icons } from '../constants';

interface DailyStatsViewProps {
  allRoutines: Record<string, DailyRoutine>;
  activeDate: Date;
  onBack: () => void;
}

type RangeType = '7D' | '30D' | '90D' | '180D' | '365D';

const DailyStatsView: React.FC<DailyStatsViewProps> = ({ allRoutines, activeDate, onBack }) => {
  const [range, setRange] = useState<RangeType>('7D');

  const analytics = useMemo(() => {
    const routinesArr = Object.values(allRoutines) as DailyRoutine[];
    
    const getDaysAgo = (days: number) => {
      const d = new Date();
      d.setHours(0,0,0,0);
      d.setDate(d.getDate() - days);
      return d;
    };

    const days = range === '7D' ? 7 : range === '30D' ? 30 : range === '90D' ? 90 : range === '180D' ? 180 : 365;
    const start = getDaysAgo(days);
    const prevStart = getDaysAgo(days * 2);
    
    const targetRoutines = routinesArr.filter(r => new Date(r.date) >= start);
    const prevRoutines = routinesArr.filter(r => {
      const d = new Date(r.date);
      return d >= prevStart && d < start;
    });

    const calculateExecution = (list: DailyRoutine[]) => {
      let total = 0;
      let completed = 0;
      let completedHours = 0;

      list.forEach(r => {
        if (r.tasks) {
          total += r.tasks.length;
          completed += r.tasks.filter(t => t.completed).length;
          r.tasks.forEach(t => {
            if (t.completed) completedHours += Math.abs(t.endTime - t.startTime);
          });
        }
      });

      return {
        rate: total > 0 ? (completed / total) * 100 : 0,
        hours: completedHours,
      };
    };

    const currentStats = calculateExecution(targetRoutines);
    const prevStats = calculateExecution(prevRoutines);
    const momentum = currentStats.rate - prevStats.rate;

    // Trend points for graph
    const points: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = getDaysAgo(i).toISOString().split('T')[0];
      const r = allRoutines[d];
      const rate = (r?.tasks?.length ?? 0) > 0 
        ? (r!.tasks.filter(t => t.completed).length / r!.tasks.length) 
        : 0;
      points.push(rate);
    }

    return { ...currentStats, momentum, points };
  }, [allRoutines, range]);

  const isPositive = analytics.momentum >= 0;
  const graphColor = isPositive ? '#10b981' : '#f43f5e';

  const renderSparkline = () => {
    const width = 800;
    const height = 200;
    const padding = 20;
    const data = analytics.points;

    if (data.length < 2) return (
      <div className="h-full flex items-center justify-center text-slate-700 font-black uppercase tracking-[0.4em] text-[8px] sm:text-[10px]">
        Deploying Sensors...
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
            <stop offset="0%" stopColor={graphColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={graphColor} stopOpacity="0" />
          </linearGradient>
          <filter id="glow-stats">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path d={`M ${padding},${height-padding} L ${pointsString} L ${width-padding},${height-padding} Z`} fill="url(#chart-grad)" className="transition-all duration-700" />
        <polyline fill="none" stroke={graphColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={pointsString} filter="url(#glow-stats)" className="transition-all duration-700" />
      </svg>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 h-full overflow-y-auto no-scrollbar pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_10px_#0ea5e9]" />
            <span className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Productivity Analytics</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none">Performance Terminal</h2>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl sm:rounded-2xl border border-white/5 backdrop-blur-3xl overflow-x-auto no-scrollbar">
          {(['7D', '30D', '90D', '180D', '365D'] as RangeType[]).map(r => (
            <button 
              key={r} 
              onClick={() => setRange(r)}
              className={`px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl text-[7px] sm:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${range === r ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500 hover:text-white'}`}
            >
              {r === '180D' ? '6M' : r === '365D' ? '1Y' : r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
        <div className="lg:col-span-3 bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[3.5rem] border border-white/5 p-6 sm:p-10 relative overflow-hidden group">
          <div className="flex flex-col sm:absolute sm:top-10 sm:right-10 items-start sm:items-end mb-8 sm:mb-0">
             <div className="text-[7px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Output</div>
             <div className="text-3xl sm:text-4xl font-black text-white tracking-tighter tabular-nums">{analytics.hours.toFixed(1)} <span className="text-sm sm:text-xl text-slate-600">HRS</span></div>
          </div>
          
          <div className="mb-8 sm:mb-12">
            <span className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 block">Success Rate</span>
            <div className="flex items-baseline gap-4">
              <span className="text-5xl sm:text-7xl font-black text-white tracking-tighter tabular-nums">{analytics.rate.toFixed(1)}%</span>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {isPositive ? '+' : ''}{analytics.momentum.toFixed(1)}% {isPositive ? 'Up' : 'Down'}
              </div>
            </div>
          </div>

          <div className="h-[140px] sm:h-[220px] w-full mt-6">
            {renderSparkline()}
          </div>
          <div className="flex justify-between mt-4">
             <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Horizon start</span>
             <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Real-time pulse</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-6">
          <div className="bg-white/5 backdrop-blur-3xl p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 flex flex-col justify-between h-36 lg:h-1/2">
             <div className="text-sky-400"><Icons.Sparkles /></div>
             <div>
                <div className="text-[7px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Consistency index</div>
                <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">{(analytics.rate * 0.9).toFixed(0)}</div>
             </div>
          </div>
          <div className="bg-white/5 backdrop-blur-3xl p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 flex flex-col justify-between h-36 lg:h-1/2">
             <div className="text-emerald-400"><Icons.Check /></div>
             <div>
                <div className="text-[7px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Volumetric growth</div>
                <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">{(analytics.hours * 1.2).toFixed(0)}</div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
         {[
           { label: 'Deep focus', val: '52%', icon: <Icons.Calendar />, color: 'text-sky-400' },
           { label: 'Wellness', val: '82%', icon: <Icons.Sun />, color: 'text-emerald-400' },
           { label: 'Networking', val: '14%', icon: <Icons.User />, color: 'text-amber-400' },
           { label: 'Recovery', val: '78%', icon: <Icons.Moon />, color: 'text-indigo-400' }
         ].map((stat, i) => (
           <div key={i} className="bg-black/40 border border-white/5 p-5 rounded-[1.5rem] sm:rounded-[2rem] flex items-center gap-3 sm:gap-4">
              <div className={`p-2.5 bg-white/5 rounded-xl ${stat.color} flex-shrink-0 scale-90 sm:scale-100`}>{stat.icon}</div>
              <div className="min-w-0">
                 <div className="text-[7px] sm:text-[8px] font-black text-slate-600 uppercase tracking-widest truncate">{stat.label}</div>
                 <div className="text-sm sm:text-lg font-black text-white">{stat.val}</div>
              </div>
           </div>
         ))}
      </div>

      <div className="mt-12 flex justify-center">
        <button 
          onClick={onBack}
          className="px-10 py-4 bg-white/5 text-slate-500 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] transition-all border border-white/5"
        >
          Return to Hub
        </button>
      </div>
    </div>
  );
};

export default DailyStatsView;
