
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Timeline from './components/Timeline';
import TaskModal from './components/TaskModal';
import HistoryView from './components/HistoryView';
import TargetsView from './components/TargetsView';
import WeatherView from './components/WeatherView';
import SyncView from './components/SyncView';
import ReflectionView from './components/ReflectionView';
import DailyStatsView from './components/DailyStatsView';
import { storageService, cloudService } from './services/storageService';
import { DailyRoutine, TimeBlock, ViewMode, Target, User } from './types';
import { Icons } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.PLANNER);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<{task: Partial<TimeBlock>, targetDate: Date} | undefined>();
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [notification, setNotification] = useState<{msg: string, type: 'info' | 'success'} | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  
  const [allRoutines, setAllRoutines] = useState<Record<string, DailyRoutine>>({});
  const [targets, setTargets] = useState<Target[]>([]);

  const isCloudConnected = cloudService.isAvailable();

  const loadTemporalData = useCallback(async () => {
    try {
      const routines = storageService.getAllRoutines();
      setAllRoutines(routines || {});
      const t = storageService.getTargets();
      setTargets(Array.isArray(t) ? t : []);
      setLastSaved(storageService.getLastSavedTime());
    } catch (e) {
      console.error("Load Error:", e);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    const initApp = async () => {
      try {
        await storageService.requestPersistence();
        const savedUser = storageService.getSession();
        setCurrentUser(savedUser);
        await loadTemporalData();
      } catch (e) {
        console.error("Init Error:", e);
      } finally {
        setIsLoadingSession(false);
      }
    };
    initApp();
  }, [loadTemporalData]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const dateKey = currentDate.toISOString().split('T')[0];
  
  const routine = useMemo(() => {
    const r = allRoutines[dateKey];
    if (r && Array.isArray(r.tasks)) return r;
    return { date: dateKey, tasks: [] };
  }, [allRoutines, dateKey]);

  const sortedTasks = useMemo(() => {
    if (!routine || !Array.isArray(routine.tasks)) return [];
    return [...routine.tasks].sort((a, b) => a.startTime - b.startTime);
  }, [routine.tasks]);

  const triggerCloudSync = async () => {
    setLastSaved(new Date().toISOString());
    if (currentUser && isCloudConnected) {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleSaveTask = (task: TimeBlock) => {
    const targetDate = editingTask?.targetDate || currentDate;
    const targetDateKey = targetDate.toISOString().split('T')[0];
    const targetRoutine = allRoutines[targetDateKey] || { date: targetDateKey, tasks: [] };

    const newTasks = editingTask?.task.id 
      ? targetRoutine.tasks.map(t => t.id === task.id ? task : t) 
      : [...targetRoutine.tasks, task];
    
    newTasks.sort((a, b) => a.startTime - b.startTime);
    const updatedRoutine = { ...targetRoutine, tasks: newTasks };
    storageService.saveRoutine(updatedRoutine);
    setAllRoutines(prev => ({ ...prev, [targetDateKey]: updatedRoutine }));
    setNotification({ msg: 'Temporal Point Committed', type: 'success' });
    triggerCloudSync();
  };

  const handleDeleteTask = (id: string) => {
    const targetDate = editingTask?.targetDate || currentDate;
    const targetDateKey = targetDate.toISOString().split('T')[0];
    const targetRoutine = allRoutines[targetDateKey] || { date: targetDateKey, tasks: [] };

    const updatedRoutine = { ...targetRoutine, tasks: targetRoutine.tasks.filter(t => t.id !== id) };
    storageService.saveRoutine(updatedRoutine);
    setAllRoutines(prev => ({ ...prev, [targetDateKey]: updatedRoutine }));
    setNotification({ msg: 'Point Erased', type: 'info' });
    setIsModalOpen(false);
    triggerCloudSync();
  };

  const handleUpdateRoutine = (updatedRoutine: DailyRoutine) => {
    storageService.saveRoutine(updatedRoutine);
    setAllRoutines(prev => ({ ...prev, [updatedRoutine.date]: updatedRoutine }));
    triggerCloudSync();
  };

  const handleSetTaskStatus = (id: string, completed: boolean) => {
    const updatedRoutine = { ...routine, tasks: routine.tasks.map(t => t.id === id ? { ...t, completed } : t) };
    storageService.saveRoutine(updatedRoutine);
    setAllRoutines(prev => ({ ...prev, [dateKey]: updatedRoutine }));
    triggerCloudSync();
  };

  const updateTargets = (newTargets: Target[]) => {
    setTargets(newTargets);
    storageService.saveTargets(newTargets);
    triggerCloudSync();
  };

  const formatLastSaved = (iso: string | null) => {
    if (!iso) return 'None';
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return 'None'; }
  };

  if (isLoadingSession) return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#020617]">
      <div className="w-12 h-12 bg-sky-600 rounded-2xl animate-pulse mb-6" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Decrypting Vault...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-100 overflow-hidden relative">
      <header className="h-auto sm:h-16 flex-shrink-0 bg-black/80 backdrop-blur-3xl border-b border-white/5 px-4 z-[100] relative py-3 sm:py-0 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <button onClick={() => { setViewMode(ViewMode.PLANNER); setCurrentDate(new Date()); }} className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110"><Icons.Calendar /></div>
              <h1 className="text-[10px] sm:text-[11px] font-black tracking-[0.3em] uppercase">Chronos</h1>
            </button>
            <div className="flex flex-col items-end sm:items-start">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-white/10 bg-white/5">
                <div className="w-1 h-1 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]" />
                <span className="text-[7px] font-black uppercase tracking-widest">Vault active</span>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-xl sm:rounded-2xl border border-white/5 overflow-x-auto no-scrollbar max-w-full">
            {[
              { mode: ViewMode.PLANNER, label: 'Schedule', icon: <Icons.Calendar /> },
              { mode: ViewMode.REFLECTION, label: 'Journal', icon: <Icons.Pen /> },
              { mode: ViewMode.DAILY_STATS, label: 'Stats', icon: <Icons.Chart /> },
              { mode: ViewMode.HISTORY, label: 'Archive', icon: <Icons.Library /> },
              { mode: ViewMode.TARGETS, label: 'Goals', icon: <Icons.Sparkles /> },
              { mode: ViewMode.SYNC, label: 'Hub', icon: <Icons.Cloud /> }
            ].map(nav => (
              <button key={nav.mode} onClick={() => setViewMode(nav.mode)} className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-lg sm:rounded-xl text-[7px] sm:text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === nav.mode ? 'bg-sky-600 text-white shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <span className="scale-90 sm:scale-100">{nav.icon}</span>
                <span className="hidden xs:inline">{nav.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {notification && (
        <div className="fixed top-28 sm:top-20 left-1/2 -translate-x-1/2 z-[110] px-6 py-2 rounded-xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest shadow-4xl animate-in slide-in-from-top-4 bg-emerald-600 text-white">
           {notification.msg}
        </div>
      )}

      <main className="flex-grow overflow-hidden relative">
        <div className="h-full overflow-y-auto scrollbar-hide">
          {viewMode === ViewMode.PLANNER && (
            <div className="max-w-7xl mx-auto px-4 py-6 w-full flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-center justify-between bg-white/5 backdrop-blur-2xl p-5 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 gap-4">
                <div className="text-center sm:text-left">
                   <h2 className="text-xl sm:text-2xl font-black text-white">{currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h2>
                   <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">{currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                   <button onClick={() => setViewMode(ViewMode.REFLECTION)} className="flex-1 sm:flex-none p-3.5 bg-sky-500/10 rounded-2xl text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all flex items-center justify-center gap-2">
                      <Icons.Pen />
                      <span className="text-[9px] font-black uppercase">Journal</span>
                   </button>
                   <button onClick={() => setCurrentDate(new Date())} className="flex-1 sm:flex-none p-3.5 bg-white/5 rounded-2xl text-[9px] font-black uppercase hover:bg-white/10 transition-all border border-white/5 text-center">Today</button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 mb-12">
                <div className="flex-[3] bg-black/40 backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[4rem] border border-white/5 p-4 flex flex-col items-center justify-center min-h-[420px] sm:min-h-[500px] relative">
                   <Timeline 
                    tasks={routine.tasks} 
                    onAddTask={(s, e) => { setEditingTask({task: {startTime:s, endTime:e}, targetDate: currentDate}); setIsModalOpen(true); }} 
                    onEditTask={(t) => { setEditingTask({task: t, targetDate: currentDate}); setIsModalOpen(true); }} 
                    onDeleteTask={handleDeleteTask} 
                    onToggleComplete={handleSetTaskStatus} 
                    selectionStart={selectionStart} 
                    setSelectionStart={setSelectionStart} 
                    isReadOnly={false} 
                  />
                </div>
                <div className="flex-[2] bg-white/5 backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-8 border border-white/5 overflow-y-auto max-h-[400px] sm:max-h-[500px] no-scrollbar">
                   <h3 className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Execution Log</h3>
                   <div className="space-y-3">
                     {sortedTasks.map(t => (
                       <div key={t.id} onClick={() => handleSetTaskStatus(t.id, !t.completed)} className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex items-center justify-between cursor-pointer group hover:bg-slate-800/40 transition-all">
                         <div className="flex-grow min-w-0 pr-2">
                            <h4 className={`text-xs font-black truncate ${t.completed ? 'text-emerald-400' : 'text-white'}`}>{t.title}</h4>
                            <span className="text-[8px] font-bold text-slate-500 uppercase">{t.category}</span>
                         </div>
                         <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${t.completed ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-500'}`}><Icons.Check /></div>
                       </div>
                     ))}
                     {sortedTasks.length === 0 && (
                       <div className="py-20 text-center opacity-20 text-[10px] font-black uppercase tracking-widest">Temporal Void</div>
                     )}
                   </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === ViewMode.HISTORY && (
            <HistoryView 
              allRoutines={allRoutines} 
              onUpdateRoutine={handleUpdateRoutine}
              onAddTask={(date, s, e) => {
                setEditingTask({task: {startTime: s, endTime: e}, targetDate: date});
                setIsModalOpen(true);
              }}
              onEditTask={(date, t) => {
                setEditingTask({task: t, targetDate: date});
                setIsModalOpen(true);
              }}
            />
          )}
          {viewMode === ViewMode.TARGETS && <TargetsView targets={targets} onUpdateTargets={updateTargets} />}
          {viewMode === ViewMode.SYNC && <SyncView onSyncRefresh={() => { loadTemporalData(); setViewMode(ViewMode.PLANNER); }} />}
          {viewMode === ViewMode.WEATHER && <WeatherView />}
          {viewMode === ViewMode.DAILY_STATS && <DailyStatsView allRoutines={allRoutines} activeDate={currentDate} onBack={() => setViewMode(ViewMode.PLANNER)} />}
          {viewMode === ViewMode.REFLECTION && <ReflectionView routine={routine} onUpdate={handleUpdateRoutine} onNotification={(m, t) => setNotification({msg:m, type:t})} onBack={() => setViewMode(ViewMode.PLANNER)} />}
        </div>
      </main>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveTask} 
        onDelete={handleDeleteTask} 
        initialTask={editingTask?.task} 
      />
    </div>
  );
};

export default App;
