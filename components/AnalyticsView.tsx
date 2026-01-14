
import React, { useMemo } from 'react';
import { DailyRoutine, CATEGORIES, TaskCategory } from '../types';

interface AnalyticsViewProps {
  allRoutines: Record<string, DailyRoutine>;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ allRoutines }) => {
  const stats = useMemo(() => {
    const totalMinutes: Record<TaskCategory, number> = { Work: 0, Health: 0, Social: 0, Hobby: 0, Personal: 0, Rest: 0 };
    const completedMinutes: Record<TaskCategory, number> = { Work: 0, Health: 0, Social: 0, Hobby: 0, Personal: 0, Rest: 0 };
    
    (Object.values(allRoutines) as DailyRoutine[]).forEach(r => {
      // Defensive check: imported routines might have missing tasks property
      if (r && Array.isArray(r.tasks)) {
        r.tasks.forEach(t => {
          if (t && t.category) {
            const duration = (t.endTime - t.startTime) * 60;
            totalMinutes[t.category] += duration;
            if (t.completed) completedMinutes[t.category] += duration;
          }
        });
      }
    });

    return { totalMinutes, completedMinutes };
  }, [allRoutines]);

  const maxVal = Math.max(...(Object.values(stats.totalMinutes) as number[]), 1);
  const radarPoints = CATEGORIES.map((cat, i) => {
    const angle = (i / CATEGORIES.length) * 2 * Math.PI - Math.PI / 2;
    const r = (stats.totalMinutes[cat] / maxVal) * 120;
    const x = 150 + r * Math.cos(angle);
    const y = 150 + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 h-full overflow-y-auto no-scrollbar pb-32">
      <div className="mb-12">
        <h2 className="text-4xl font-black text-white tracking-tight">Life-Balance Analytics</h2>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[11px]">Visualizing your time investments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 flex flex-col items-center">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-10">Balance Radar</h3>
          <div className="relative w-[300px] h-[300px]">
            <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
               {[0.2, 0.4, 0.6, 0.8, 1].map(scale => (
                 <circle key={scale} cx="150" cy="150" r={scale * 120} fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="1" />
               ))}
               {CATEGORIES.map((cat, i) => {
                 const angle = (i / CATEGORIES.length) * 2 * Math.PI - Math.PI / 2;
                 const x = 150 + 135 * Math.cos(angle);
                 const y = 150 + 135 * Math.sin(angle);
                 return (
                   <g key={cat}>
                     <line x1="150" y1="150" x2={150 + 120 * Math.cos(angle)} y2={150 + 120 * Math.sin(angle)} stroke="white" strokeOpacity="0.1" />
                     <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 font-black text-[9px] uppercase tracking-widest">{cat}</text>
                   </g>
                 );
               })}
               <polygon points={radarPoints} fill="rgba(14, 165, 233, 0.2)" stroke="#0ea5e9" strokeWidth="3" className="drop-shadow-3xl" />
            </svg>
          </div>
        </div>

        <div className="space-y-6">
          {CATEGORIES.map(cat => {
            const total = Math.round(stats.totalMinutes[cat] / 60);
            const comp = Math.round(stats.completedMinutes[cat] / 60);
            const perc = total > 0 ? Math.round((comp / total) * 100) : 0;
            return (
              <div key={cat} className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{cat} Focus</h4>
                  <div className="text-2xl font-black text-white mt-1">{total} Hours Invested</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Completion</div>
                  <div className="text-2xl font-black text-white mt-1">{perc}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
