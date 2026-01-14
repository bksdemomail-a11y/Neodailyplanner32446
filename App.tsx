
import React, { useState, useEffect, useMemo } from 'react';
import Timeline from './components/Timeline';
import TaskModal from './components/TaskModal';
import HistoryView from './components/HistoryView';
import TargetsView from './components/TargetsView';
import WeatherView from './components/WeatherView';
import SyncView from './components/SyncView';
import AuthView from './components/AuthView';
import ReflectionView from './components/ReflectionView';
import DailyStatsView from './components/DailyStatsView';
import { storageService } from './services/storageService';
import { geminiService } from './services/geminiService';
import { DailyRoutine, TimeBlock, ViewMode, Target, COLORS, User } from './types';
import { Icons } from './constants';

const MOTIVATION_WORDS = ["Focus", "Discipline", "Consistency", "Action", "Routine", "Success"];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.PLANNER);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<TimeBlock> | undefined>();
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [notification, setNotification] = useState<{msg: string, type: 'info' | 'success'} | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  
  const [allRoutines, setAllRoutines] = useState<Record<string, DailyRoutine>>({});
  const [targets, setTargets] = useState<Target[]>([]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    const initApp = async () => {
      await storageService.requestPersistence();
      setAllRoutines(storageService.getAllRoutines());
      setTargets(storageService.getTargets());
    };
    initApp();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const dateKey = currentDate.toISOString().split('T')[0];
  const routine = useMemo(() => allRoutines[dateKey] || { date: dateKey, tasks: [] }, [allRoutines, dateKey]);
  const sortedTasks = useMemo(() => [...routine.tasks].sort((a, b) => a.startTime - b.startTime), [routine.tasks]);

  const triggerCloudSync = async () => {
    if (currentUser) {
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }, 800);
    }
  };

  const handleSaveTask = (task: TimeBlock) => {
    const newTasks = editingTask?.id ? routine.tasks.map(t => t.id === task.id ? task : t) : [...routine.tasks, task];
    newTasks.sort((a, b) => a.startTime - b.startTime);
    const updatedRoutine = { ...routine, tasks: newTasks };
    
    storageService.saveRoutine(updatedRoutine, currentUser?.id);
    setAllRoutines({ ...allRoutines, [dateKey]: updatedRoutine });
    setNotification({ msg: 'Saved & Synced', type: 'success' });
    triggerCloudSync();
  };

  const handleDeleteTask = (id: string) => {
    const updatedRoutine = { ...routine, tasks: routine.tasks.filter(t => t.id !== id) };
    storageService.saveRoutine(updatedRoutine, currentUser?.id);
    setAllRoutines({ ...allRoutines, [dateKey]: updatedRoutine });
    setNotification({ msg: 'Task Removed', type: 'info' });
    setIsModalOpen(false);
    triggerCloudSync();
  };

  const handleUpdateRoutine = (updatedRoutine: DailyRoutine) => {
    storageService.saveRoutine(updatedRoutine, currentUser?.id);
    setAllRoutines({ ...allRoutines, [dateKey]: updatedRoutine });
    triggerCloudSync();
  };

  const handleSetTaskStatus = (id: string, completed: boolean) => {
    const updatedRoutine = { ...routine, tasks: routine.tasks.map(t => t.id === id ? { ...t, completed } : t) };
    storageService.saveRoutine(updatedRoutine, currentUser?.id);
    setAllRoutines({ ...allRoutines, [dateKey]: updatedRoutine });
    triggerCloudSync();
  };

  const updateTargets = (newTargets: Target[]) => {
    setTargets(newTargets);
    storageService.saveTargets(newTargets, currentUser?.id);
    triggerCloudSync();
  };

  if (!currentUser && viewMode !== ViewMode.SYNC) {
    return <AuthView onAuthSuccess={(user) => { setCurrentUser(user); setViewMode(ViewMode.PLANNER); }} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-100 overflow-hidden relative">
      <header className="flex-shrink-0 bg-black/60 backdrop-blur-3xl border-b border-white/5 px-4 py-1 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode(ViewMode.PLANNER)} className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-white shadow-2xl"><Icons.Calendar /></div>
              <h1 className="text-[11px] font-black tracking-[0.4em] hidden sm:block uppercase">Chronos</h1>
            </button>
            
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${currentUser ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-sky-400 animate-ping' : 'bg-sky-500 shadow-[0_0_8px_#0ea5e9]'}`} />
              <span className="text-[8px] font-black uppercase tracking-widest">
                {isSyncing ? 'Cloud Syncing...' : currentUser ? 'Cloud Connected' : 'Local Only'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            {[
              { mode: ViewMode.PLANNER, label: 'Schedule', icon: <Icons.Calendar /> },
              { mode: ViewMode.REFLECTION, label: 'Memories', icon: <Icons.Pen /> },
              { mode: ViewMode.DAILY_STATS, label: 'Stats', icon: <Icons.Chart /> },
              { mode: ViewMode.TARGETS, label: 'Missions', icon: <Icons.Sparkles /> },
              { mode: ViewMode.SYNC, label: 'Backup', icon: <Icons.Cloud /> }
            ].map(nav => (
              <button key={nav.mode} onClick={() => setViewMode(nav.mode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${viewMode === nav.mode ? 'bg-sky-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>
                <span className="lg:hidden">{nav.icon}</span>
                <span className="hidden lg:inline">{nav.label}</span>
              </button>
            ))}
            {currentUser && <button onClick={() => setCurrentUser(null)} className="ml-2 p-1.5 text-slate-500 hover:text-rose-400"><Icons.X /></button>}
          </div>
        </div>
      </header>

      {notification && (
        <div className={`fixed top-14 left-1/2 -translate-x-1/2 z-[100] px-6 py-2.5 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-4xl animate-in slide-in-from-top-4 ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white'}`}>
           {notification.msg}
        </div>
      )}

      <main className="flex-grow overflow-hidden relative">
        <div className="h-full overflow-y-auto scrollbar-hide">
          {viewMode === ViewMode.PLANNER && (
            <div className="max-w-7xl mx-auto px-4 py-4 w-full flex flex-col gap-6">
              <div className="flex items-center justify-between bg-white/5 backdrop-blur-2xl p-4 rounded-3xl border border-white/5">
                <div className="flex flex-col">
                   <h2 className="text-2xl font-black text-white">{currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h2>
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">{currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => setViewMode(ViewMode.REFLECTION)} className="p-3 bg-sky-500/10 rounded-2xl text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all flex items-center gap-2">
                      <Icons.Pen />
                      <span className="text-[9px] font-black uppercase hidden sm:inline">Add Memories</span>
                   </button>
                   <button onClick={() => setViewMode(ViewMode.HISTORY)} className="p-3 bg-white/5 rounded-2xl text-[9px] font-black uppercase border border-white/5">Archive</button>
                   <button onClick={() => setCurrentDate(new Date())} className="p-3 bg-white/5 rounded-2xl text-[9px] font-black uppercase">Today</button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 mb-12">
                <div className="flex-[3] bg-black/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 p-4 flex flex-col items-center justify-center min-h-[500px] relative">
                   <Timeline 
                    tasks={routine.tasks} 
                    onAddTask={(s, e) => { setEditingTask({startTime:s, endTime:e}); setIsModalOpen(true); }} 
                    onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }} 
                    onDeleteTask={handleDeleteTask} 
                    onToggleComplete={handleSetTaskStatus} 
                    selectionStart={selectionStart} 
                    setSelectionStart={setSelectionStart} 
                    isReadOnly={false} 
                  />
                </div>
                <div className="flex-[2] bg-white/5 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/5 overflow-y-auto max-h-[500px] no-scrollbar">
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Execution Log</h3>
                   <div className="space-y-3">
                     {sortedTasks.map(t => (
                       <div key={t.id} onClick={() => handleSetTaskStatus(t.id, !t.completed)} className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex items-center justify-between cursor-pointer group">
                         <div>
                            <h4 className={`text-xs font-black ${t.completed ? 'text-emerald-400' : 'text-white'}`}>{t.title}</h4>
                            <span className="text-[8px] font-bold text-slate-500 uppercase">{t.category}</span>
                         </div>
                         <div className={`p-2 rounded-lg ${t.completed ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-500'}`}><Icons.Check /></div>
                       </div>
                     ))}
                     {sortedTasks.length === 0 && (
                       <div className="py-10 text-center opacity-20 text-[10px] font-black uppercase tracking-widest">No plans yet for this date</div>
                     )}
                   </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === ViewMode.HISTORY && <HistoryView allRoutines={allRoutines} onSelectDate={(d) => { setCurrentDate(d); setViewMode(ViewMode.PLANNER); }} onAddTask={()=>{}} onEditTask={()=>{}} />}
          {viewMode === ViewMode.TARGETS && <TargetsView targets={targets} onUpdateTargets={updateTargets} />}
          {viewMode === ViewMode.SYNC && <SyncView onSyncComplete={() => setViewMode(ViewMode.PLANNER)} />}
          {viewMode === ViewMode.DAILY_STATS && <DailyStatsView routine={routine} onBack={() => setViewMode(ViewMode.PLANNER)} />}
          {viewMode === ViewMode.REFLECTION && <ReflectionView routine={routine} onUpdate={handleUpdateRoutine} onNotification={(m, t) => setNotification({msg:m, type:t})} onBack={() => setViewMode(ViewMode.PLANNER)} />}
        </div>
      </main>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} onDelete={handleDeleteTask} initialTask={editingTask} />
    </div>
  );
};

export default App;
