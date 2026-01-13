
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Timeline from './components/Timeline';
import TaskModal from './components/TaskModal';
import HistoryView from './components/HistoryView';
import TargetsView from './components/TargetsView';
import WeatherView from './components/WeatherView';
import SyncView from './components/SyncView';
import ReflectionView from './components/ReflectionView';
import DailyStatsView from './components/DailyStatsView';
import { storageService } from './services/storageService';
import { geminiService } from './services/geminiService';
import { DailyRoutine, TimeBlock, ViewMode, Target, COLORS } from './types';
import { Icons } from './constants';

const MOTIVATION_WORDS = [
  "Focus", "Discipline", "Consistency", "Action", "Routine", 
  "Success", "Persistence", "Deep Work", "Clarity", "Progress",
  "Momentum", "Flow", "Growth", "Purpose", "Impact", "Breathe",
  "Energy", "Execute", "Results", "Mindset"
];

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.PLANNER);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<TimeBlock> | undefined>();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [notification, setNotification] = useState<{msg: string, type: 'info' | 'success'} | null>(null);
  
  const [allRoutines, setAllRoutines] = useState<Record<string, DailyRoutine>>({});
  const [targets, setTargets] = useState<Target[]>([]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    setAllRoutines(storageService.getAllRoutines());
    setTargets(storageService.getTargets());
  }, [viewMode, currentDate]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const motivationContainer = document.getElementById('motivation-layer');
    const spawnWord = () => {
      if (!motivationContainer) return;
      const word = document.createElement('div');
      word.className = 'motivation-word';
      word.innerText = MOTIVATION_WORDS[Math.floor(Math.random() * MOTIVATION_WORDS.length)];
      word.style.left = `${Math.random() * 80 + 10}%`;
      word.style.top = `${Math.random() * 80 + 10}%`;
      motivationContainer.appendChild(word);
      setTimeout(() => {
        if (motivationContainer && motivationContainer.contains(word)) {
          motivationContainer.removeChild(word);
        }
      }, 14000);
    };
    const motivationInterval = setInterval(spawnWord, 8000);
    spawnWord(); 
    return () => clearInterval(motivationInterval);
  }, []);

  const dateKey = currentDate.toISOString().split('T')[0];
  const routine = useMemo(() => allRoutines[dateKey] || { date: dateKey, tasks: [] }, [allRoutines, dateKey]);

  const sortedTasks = useMemo(() => {
    return [...routine.tasks].sort((a, b) => a.startTime - b.startTime);
  }, [routine.tasks]);

  const isToday = dateKey === new Date().toISOString().split('T')[0];
  const isPast = currentDate < new Date() && !isToday;

  const handleSelectHistoryDate = (date: Date) => {
    setCurrentDate(date);
    setViewMode(ViewMode.PLANNER);
    setAiAnalysis(null);
  };

  const handleAddTaskRange = (start: number, end: number) => {
    if (isPast) return;
    setEditingTask({ startTime: start, endTime: end });
    setIsModalOpen(true);
    setSelectionStart(null);
  };

  const handleEditTask = (task: TimeBlock) => {
    if (isPast) return;
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (task: TimeBlock) => {
    const newTasks = editingTask?.id 
      ? routine.tasks.map(t => t.id === task.id ? task : t)
      : [...routine.tasks, task];
    
    newTasks.sort((a, b) => a.startTime - b.startTime);
    const updatedRoutine = { ...routine, tasks: newTasks };
    storageService.saveRoutine(updatedRoutine);
    
    const updatedAllRoutines = { ...allRoutines, [dateKey]: updatedRoutine };
    setAllRoutines(updatedAllRoutines);
    setEditingTask(undefined);
    setNotification({ msg: 'Schedule Updated', type: 'success' });
  };

  const handleDeleteTask = (id: string) => {
    const updatedRoutine = { ...routine, tasks: routine.tasks.filter(t => t.id !== id) };
    storageService.saveRoutine(updatedRoutine);
    setAllRoutines(storageService.getAllRoutines());
    setIsModalOpen(false);
  };

  const handleSetTaskStatus = (id: string, completed: boolean) => {
    const updatedRoutine = { 
      ...routine, 
      tasks: routine.tasks.map(t => t.id === id ? { ...t, completed } : t) 
    };
    storageService.saveRoutine(updatedRoutine);
    setAllRoutines(storageService.getAllRoutines());
    setNotification({ msg: completed ? 'Task Completed' : 'Task Marked Incomplete', type: 'info' });
  };

  const updateRoutine = (updatedRoutine: DailyRoutine) => {
    storageService.saveRoutine(updatedRoutine);
    setAllRoutines({ ...allRoutines, [dateKey]: updatedRoutine });
  };

  const formatTimeStr = (t: number) => {
    const h = Math.floor(t) % 24;
    const m = Math.round((t % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-100 transition-colors duration-300 overflow-hidden relative selection:bg-sky-500/30">
      <header className="flex-shrink-0 bg-black/60 backdrop-blur-3xl border-b border-white/5 px-4 py-1 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => setViewMode(ViewMode.PLANNER)} className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-white shadow-2xl shadow-sky-500/20 group-hover:scale-105 transition-all">
              <Icons.Calendar />
            </div>
            <h1 className="text-[11px] font-black tracking-[0.4em] hidden sm:block uppercase text-white/90">Chronos</h1>
          </button>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
            {[
              { mode: ViewMode.PLANNER, label: 'Schedule', icon: <Icons.Calendar /> },
              { mode: ViewMode.DAILY_STATS, label: 'Stats', icon: <Icons.Chart /> },
              { mode: ViewMode.REFLECTION, label: 'Reflect', icon: <Icons.Pen /> },
              { mode: ViewMode.TARGETS, label: 'Missions', icon: <Icons.Sparkles /> },
              { mode: ViewMode.WEATHER, label: 'Weather', icon: <Icons.Sun /> },
              { mode: ViewMode.SYNC, label: 'Cloud', icon: <Icons.Cloud /> }
            ].map(nav => (
              <button key={nav.mode} onClick={() => setViewMode(nav.mode)} className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${viewMode === nav.mode ? 'bg-sky-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <span className="lg:hidden">{nav.icon}</span>
                <span className="hidden lg:inline">{nav.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {notification && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[100] px-5 py-2 rounded-full font-black text-[8px] uppercase tracking-widest shadow-4xl animate-in slide-in-from-top-2 ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white'}`}>
           {notification.msg}
        </div>
      )}

      <main className="flex-grow flex flex-col overflow-hidden z-10 relative">
        <div className="flex-grow overflow-y-auto scrollbar-hide">
          {viewMode === ViewMode.PLANNER && (
            <div className="max-w-7xl mx-auto px-4 py-4 w-full flex flex-col gap-6">
              <div className="flex items-center justify-between bg-white/5 backdrop-blur-2xl p-4 rounded-3xl border border-white/5">
                <div className="flex flex-col">
                   <h2 className="text-2xl font-black text-white tracking-tight">{currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h2>
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">{currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => setViewMode(ViewMode.HISTORY)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all border border-white/5" title="Archive / History">
                     Archive
                   </button>
                   <button onClick={() => setViewMode(ViewMode.DAILY_STATS)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-all border border-emerald-500/20">
                     <Icons.Chart />
                   </button>
                   <button onClick={() => setCurrentDate(new Date())} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">Today</button>
                   <button onClick={() => setViewMode(ViewMode.REFLECTION)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-sky-400 hover:text-sky-300 transition-all border border-sky-500/20"><Icons.Pen /></button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 mb-12">
                <div className="flex-[3] bg-black/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 p-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
                   <Timeline 
                    tasks={routine.tasks} 
                    onAddTask={handleAddTaskRange} 
                    onEditTask={handleEditTask} 
                    onDeleteTask={handleDeleteTask} 
                    onToggleComplete={(id) => handleSetTaskStatus(id, !routine.tasks.find(t => t.id === id)?.completed)} 
                    selectionStart={selectionStart} 
                    setSelectionStart={setSelectionStart} 
                    isReadOnly={isPast} 
                  />
                  {isPast && (
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] pointer-events-none flex items-center justify-center">
                       <div className="bg-slate-900/90 px-6 py-3 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-4xl">Archive Mode Only</div>
                    </div>
                  )}
                </div>

                <div className="flex-[2] flex flex-col gap-6">
                  <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/5 flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Schedule Detail</h3>
                      <button onClick={() => geminiService.analyzeRoutine(routine).then(setAiAnalysis)} className="p-2 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500/20"><Icons.Sparkles /></button>
                    </div>
                    
                    <div className="space-y-3 flex-grow overflow-y-auto no-scrollbar max-h-[600px] pb-10">
                      {sortedTasks.map(task => {
                        const color = COLORS.find(c => c.hex === task.color) || COLORS[0];
                        return (
                          <div key={task.id} onClick={() => handleEditTask(task)} className={`group flex items-center gap-4 p-4 rounded-[2rem] bg-slate-900/40 border border-white/5 cursor-pointer hover:bg-slate-800 transition-all`}>
                             <div className="flex flex-col items-center">
                               <span className="text-[7px] font-black text-slate-500">{formatTimeStr(task.startTime)}</span>
                               <div className={`w-1 h-3 my-0.5 rounded-full ${color.bg}`} />
                               <span className="text-[7px] font-black text-slate-500">{formatTimeStr(task.endTime)}</span>
                             </div>
                             <div className="flex-grow">
                               <h4 className={`text-xs font-black transition-colors ${task.completed ? 'text-emerald-400' : 'text-white group-hover:text-sky-400'}`}>{task.title}</h4>
                               <span className="text-[7px] font-bold text-slate-600 uppercase tracking-widest">{task.category}</span>
                             </div>
                             <div className="flex gap-2">
                               <button 
                                onClick={(e) => { e.stopPropagation(); handleSetTaskStatus(task.id, true); }} 
                                className={`p-2 rounded-xl transition-all ${task.completed ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-500 hover:text-emerald-400'}`}
                                title="Mark Complete"
                               >
                                 <Icons.Check />
                               </button>
                               <button 
                                onClick={(e) => { e.stopPropagation(); handleSetTaskStatus(task.id, false); }} 
                                className={`p-2 rounded-xl transition-all ${!task.completed ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-white/5 text-slate-500 hover:text-rose-400'}`}
                                title="Mark Incomplete"
                               >
                                 <Icons.X />
                               </button>
                             </div>
                          </div>
                        );
                      })}
                      {sortedTasks.length === 0 && (
                        <div className="py-10 flex flex-col items-center justify-center opacity-20 text-center">
                           <Icons.Calendar />
                           <p className="text-[10px] font-black uppercase tracking-widest mt-4">Day remains unwritten</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === ViewMode.HISTORY && <HistoryView allRoutines={allRoutines} onSelectDate={handleSelectHistoryDate} onAddTask={handleAddTaskRange} onEditTask={handleEditTask} />}
          {viewMode === ViewMode.REFLECTION && <ReflectionView routine={routine} onUpdate={updateRoutine} onNotification={(m, t) => setNotification({msg: m, type: t})} onBack={() => setViewMode(ViewMode.PLANNER)} />}
          {viewMode === ViewMode.TARGETS && <TargetsView targets={targets} onUpdateTargets={(t) => { setTargets(t); storageService.saveTargets(t); }} />}
          {viewMode === ViewMode.WEATHER && <WeatherView />}
          {viewMode === ViewMode.SYNC && <SyncView onSyncComplete={() => setViewMode(ViewMode.PLANNER)} />}
          {viewMode === ViewMode.DAILY_STATS && <DailyStatsView routine={routine} onBack={() => setViewMode(ViewMode.PLANNER)} />}
        </div>
      </main>

      <TaskModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTask(undefined); setSelectionStart(null); }} onSave={handleSaveTask} onDelete={handleDeleteTask} initialTask={editingTask} />
    </div>
  );
};

export default App;
