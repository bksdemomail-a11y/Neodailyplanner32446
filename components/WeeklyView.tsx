
import React from 'react';
import { DailyRoutine, COLORS } from '../types';

interface WeeklyViewProps {
  currentDate: Date;
  allRoutines: Record<string, DailyRoutine>;
}

const WeeklyView: React.FC<WeeklyViewProps> = ({ currentDate, allRoutines }) => {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  return (
    <div className="grid grid-cols-7 gap-2 overflow-x-auto pb-4">
      {days.map((day, i) => {
        const dateStr = formatDate(day);
        const routine = allRoutines[dateStr];
        const isToday = formatDate(new Date()) === dateStr;

        return (
          <div key={dateStr} className={`min-w-[120px] rounded-xl p-3 border h-[600px] flex flex-col ${isToday ? 'bg-sky-50 border-sky-200' : 'bg-white border-slate-100'}`}>
            <div className="text-center mb-4">
              <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-sky-600' : 'text-slate-400'}`}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <div className={`text-lg font-bold ${isToday ? 'text-sky-700' : 'text-slate-700'}`}>
                {day.getDate()}
              </div>
            </div>

            <div className="relative flex-grow bg-slate-50/50 rounded-lg border border-dashed border-slate-200 overflow-hidden">
              {routine?.tasks.map(task => {
                const colorConfig = COLORS.find(c => c.hex === task.color) || COLORS[0];
                return (
                  <div 
                    key={task.id}
                    className={`absolute left-1 right-1 rounded-md text-[8px] p-1 font-medium ${colorConfig.bg} ${colorConfig.text} truncate opacity-90`}
                    style={{ 
                      top: `${(task.startTime / 24) * 100}%`,
                      height: `${((task.endTime - task.startTime) / 24) * 100}%`
                    }}
                  >
                    {task.title}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyView;
