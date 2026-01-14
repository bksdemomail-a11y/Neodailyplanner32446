
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TimeBlock, COLORS } from '../types';
import { Icons } from '../constants';

interface TimelineProps {
  tasks: TimeBlock[];
  onAddTask: (startTime: number, endTime: number) => void;
  onEditTask: (task: TimeBlock) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  selectionStart: number | null;
  setSelectionStart: (time: number | null) => void;
  isReadOnly?: boolean;
}

const Timeline: React.FC<TimelineProps> = ({ 
  tasks, 
  onAddTask, 
  onEditTask, 
  onDeleteTask, 
  onToggleComplete,
  selectionStart,
  setSelectionStart,
  isReadOnly = false
}) => {
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const SIZE = 500;
  const CENTER = SIZE / 2;
  const TASK_RADIUS = 215;
  const LABEL_RADIUS = 165;
  const TICK_OUTER = 145;
  const TICK_INNER = 135;
  const INTERVAL_RADIUS = 115;

  const timeToAngle = (hour: number) => ((hour % 12) * 30) - 90;

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, startAngle);
    const end = polarToCartesian(x, y, radius, endAngle);
    const diff = ((endAngle - startAngle + 360) % 360);
    const largeArcFlag = diff <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
    ].join(" ");
  };

  const handleTimeClick = (e: React.MouseEvent, time: number) => {
    if (isReadOnly) return;
    e.stopPropagation();
    if (selectionStart === null) {
      setSelectionStart(time);
    } else {
      const s = Math.min(selectionStart, time);
      const f = Math.max(selectionStart, time);
      onAddTask(s, f === s ? s + 1 : f);
    }
  };

  const formatTimeStr = (t: number) => {
    const h = Math.floor(t) % 24;
    const m = Math.round((t % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const currentTask = useMemo(() => {
    const now = currentTime.getHours() + currentTime.getMinutes() / 60;
    return tasks.find(t => now >= t.startTime && now < t.endTime && !t.completed);
  }, [tasks, currentTime]);

  const timeLeft = useMemo(() => {
    if (!currentTask) return null;
    const now = currentTime.getHours() + currentTime.getMinutes() / 60;
    const diff = currentTask.endTime - now;
    const mins = Math.max(0, Math.floor(diff * 60));
    const secs = Math.max(0, Math.floor((diff * 60 * 60) % 60));
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [currentTask, currentTime]);

  const calculateDuration = (t1: number, t2: number) => {
    const diff = Math.abs(t2 - t1);
    const finalDiff = diff === 0 ? 1 : diff;
    const hours = Math.floor(finalDiff);
    const mins = Math.round((finalDiff % 1) * 60);
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const scrollToSection = (index: number) => {
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({ left: index * width, behavior: 'smooth' });
    }
  };

  const renderClock = (baseHour: number, label: string) => {
    const now = currentTime.getHours() + currentTime.getMinutes() / 60;
    const isCurrentCycle = now >= baseHour && now < baseHour + 12;
    const cycleTasks = tasks.filter(t => t.startTime >= baseHour && t.startTime < baseHour + 12);

    return (
      <div className="flex-shrink-0 w-full snap-start flex flex-col items-center justify-center py-2 sm:py-0 px-2 sm:px-4">
        <h3 className="text-[7px] sm:text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 sm:mb-2 bg-white/5 px-4 sm:px-6 py-1 sm:py-1.5 rounded-full border border-white/5 backdrop-blur-3xl">
          {label} Cycle
        </h3>
        
        <div className="relative w-full aspect-square max-w-[340px] sm:max-w-[420px]">
          <svg 
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="w-full h-full cursor-crosshair overflow-visible"
          >
            <defs>
              {cycleTasks.map(task => {
                const startAngle = timeToAngle(task.startTime);
                const endAngle = timeToAngle(task.endTime);
                return <path key={`p-${task.id}`} id={`path-${task.id}-${baseHour}`} d={describeArc(CENTER, CENTER, TASK_RADIUS, startAngle, endAngle)} />;
              })}
              <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <circle cx={CENTER} cy={CENTER} r={TICK_OUTER + 10} className="fill-black/40 stroke-white/5" strokeWidth="1" />
            
            {[...Array(12)].map((_, i) => {
              const hourLabel = i === 0 ? 12 : i;
              const actualTime = baseHour + i;
              const hourAngle = timeToAngle(i);
              const labelPos = polarToCartesian(CENTER, CENTER, LABEL_RADIUS, hourAngle);
              const tickStart = polarToCartesian(CENTER, CENTER, TICK_INNER, hourAngle);
              const tickEnd = polarToCartesian(CENTER, CENTER, TICK_OUTER, hourAngle);
              
              const isHourHovered = hoverTime === actualTime;
              const isHourSelected = selectionStart === actualTime;

              return (
                <g key={i}>
                  <line x1={tickStart.x} y1={tickStart.y} x2={tickEnd.x} y2={tickEnd.y} className="stroke-white/10" strokeWidth="2" strokeLinecap="round" />
                  <text 
                    x={labelPos.x} 
                    y={labelPos.y} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    onClick={(e) => handleTimeClick(e, actualTime)}
                    onMouseEnter={() => setHoverTime(actualTime)}
                    onMouseLeave={() => setHoverTime(null)}
                    className={`text-[16px] sm:text-[20px] font-black tabular-nums tracking-tighter cursor-pointer transition-all duration-200 select-none ${isHourSelected ? 'fill-sky-400 scale-125' : isHourHovered ? 'fill-sky-300 scale-110' : 'fill-slate-600 hover:fill-slate-300'}`}
                  >
                    {hourLabel}
                  </text>
                  
                  {[0.25, 0.5, 0.75].map(offset => {
                    const time = baseHour + i + offset;
                    const angle = timeToAngle(i + offset);
                    const pipPos = polarToCartesian(CENTER, CENTER, INTERVAL_RADIUS, angle);
                    const isSelected = selectionStart === time;
                    const isHovered = hoverTime === time;
                    const isMiddle = offset === 0.5;
                    const radius = isSelected || isHovered ? (isMiddle ? 6 : 4) : (isMiddle ? 3 : 1.5);

                    return (
                      <circle
                        key={offset}
                        cx={pipPos.x}
                        cy={pipPos.y}
                        r={radius}
                        className={`transition-all duration-200 cursor-pointer ${isSelected ? 'fill-sky-400' : isHovered ? 'fill-sky-300' : isMiddle ? 'fill-white/10 hover:fill-sky-500/50' : 'fill-white/5 hover:fill-sky-400/30'}`}
                        onClick={(e) => handleTimeClick(e, time)}
                        onMouseEnter={() => setHoverTime(time)}
                        onMouseLeave={() => setHoverTime(null)}
                      />
                    );
                  })}
                </g>
              );
            })}

            {cycleTasks.map(task => {
              const color = COLORS.find(c => c.hex === task.color) || COLORS[0];
              const duration = task.endTime - task.startTime;
              const isActivelyFocusing = currentTask?.id === task.id;
              return (
                <g key={task.id} className={`transition-all ${task.completed ? 'opacity-20' : 'opacity-100'}`}>
                  <use 
                    href={`#path-${task.id}-${baseHour}`} 
                    fill="none" 
                    stroke={color.hex} 
                    strokeWidth={isActivelyFocusing ? "42" : "30"} 
                    strokeLinecap="round" 
                    filter="url(#glow)"
                    className={`cursor-pointer transition-all ${isActivelyFocusing ? 'animate-pulse stroke-white/80' : 'active:stroke-white'}`} 
                    onClick={(e) => { e.stopPropagation(); onEditTask(task); }} 
                  />
                  {duration >= 0.5 && (
                    <text dy="6" className="fill-white pointer-events-none select-none text-[10px] sm:text-[13px] font-black uppercase tracking-widest">
                      <textPath 
                        href={`#path-${task.id}-${baseHour}`} 
                        startOffset="50%" 
                        textAnchor="middle"
                        style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.95)', strokeWidth: '4px', strokeLinejoin: 'round' }}
                      >
                        {task.title}
                      </textPath>
                    </text>
                  )}
                </g>
              );
            })}

            {isCurrentCycle && (
              <g filter="url(#glow)">
                <line 
                  x1={CENTER} 
                  y1={CENTER} 
                  x2={polarToCartesian(CENTER, CENTER, TICK_OUTER + 10, timeToAngle(now)).x} 
                  y2={polarToCartesian(CENTER, CENTER, TICK_OUTER + 10, timeToAngle(now)).y} 
                  className="stroke-rose-500" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                />
                <circle cx={polarToCartesian(CENTER, CENTER, TICK_OUTER + 10, timeToAngle(now)).x} cy={polarToCartesian(CENTER, CENTER, TICK_OUTER + 10, timeToAngle(now)).y} r="5" className="fill-rose-500" />
              </g>
            )}

            <circle cx={CENTER} cy={CENTER} r="4" className="fill-white" />
          </svg>

          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div className={`text-center bg-black/90 backdrop-blur-3xl p-2 sm:p-4 rounded-full w-20 h-20 sm:w-28 sm:h-28 flex flex-col items-center justify-center border border-white/5 shadow-4xl transition-all duration-500 ${currentTask ? 'scale-110 border-sky-500/20 shadow-sky-500/10' : ''}`}>
                {currentTask && isCurrentCycle ? (
                  <div className="flex flex-col items-center animate-in zoom-in-95">
                    <div className="text-[6px] sm:text-[7px] font-black text-sky-400 uppercase tracking-[0.4em] mb-0.5 sm:mb-1 animate-pulse">Live</div>
                    <div className="text-sm sm:text-xl font-black text-white tabular-nums tracking-tighter leading-none">
                       {timeLeft}
                    </div>
                    <div className="text-[6px] sm:text-[7px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 sm:mt-1.5 truncate max-w-[60px] sm:max-w-[80px]">
                      {currentTask.title}
                    </div>
                  </div>
                ) : selectionStart !== null && hoverTime !== null ? (
                  <div className="flex flex-col items-center">
                    <div className="text-[6px] sm:text-[7px] font-black text-sky-400 uppercase tracking-[0.5em] mb-0.5 sm:mb-1 animate-pulse">Range</div>
                    <div className="text-sm sm:text-xl font-black text-white tabular-nums tracking-tighter">
                      {calculateDuration(selectionStart, hoverTime)}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-[6px] sm:text-[7px] font-black text-slate-500 uppercase tracking-[0.4em]">
                       {hoverTime !== null ? 'Seek' : 'Real-time'}
                    </div>
                    <div className="text-base sm:text-2xl font-black text-white tabular-nums tracking-tighter mt-0.5 leading-none">
                       {hoverTime !== null ? formatTimeStr(hoverTime) : formatTimeStr(now)}
                    </div>
                  </>
                )}
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="relative flex flex-col w-full mx-auto select-none flex-grow h-full overflow-hidden"
      onClick={() => !isReadOnly && setSelectionStart(null)}
    >
      <div 
        ref={scrollContainerRef} 
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide flex-grow h-full items-center"
      >
        {renderClock(0, "AM")}
        {renderClock(12, "PM")}
      </div>

      <div 
        className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center bg-black/95 backdrop-blur-3xl p-0.5 sm:p-1 rounded-full shadow-4xl border border-white/10 z-[60]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => scrollToSection(0)} className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-slate-500 hover:text-sky-400 hover:bg-white/5 transition-all">AM</button>
        <div className="w-px h-2 sm:h-3 bg-white/10 mx-0.5 sm:mx-1" />
        <button onClick={() => scrollToSection(1)} className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-slate-500 hover:text-sky-400 hover:bg-white/5 transition-all">PM</button>
      </div>
    </div>
  );
};

export default Timeline;
