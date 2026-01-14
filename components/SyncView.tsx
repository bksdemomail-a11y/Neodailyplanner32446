
import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { Icons } from '../constants';

interface SyncViewProps {
  onSyncComplete: () => void;
  userId?: string;
}

const SyncView: React.FC<SyncViewProps> = ({ onSyncComplete, userId }) => {
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'none', msg: string }>({ type: 'none', msg: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const stats = useMemo(() => {
    const routines = Object.keys(storageService.getAllRoutines()).length;
    const targets = storageService.getTargets().length;
    return { routines, targets };
  }, []);

  const handleExport = () => {
    const data = storageService.getRawData(userId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronos_archive_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', msg: 'Archive downloaded successfully!' });
    setTimeout(() => setStatus({ type: 'none', msg: '' }), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Using the internal import logic via token-style or direct object
        // For simplicity, we'll re-use the b64 logic or just manually set items
        const token = btoa(JSON.stringify(json));
        const success = storageService.importAllData(token);
        if (success) {
          setStatus({ type: 'success', msg: 'Data restored! Refreshing...' });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setStatus({ type: 'error', msg: 'Invalid backup file format.' });
        }
      } catch (err) {
        setStatus({ type: 'error', msg: 'Failed to read file.' });
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 min-h-screen pb-32 animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="w-20 h-20 bg-sky-600/20 text-sky-400 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-sky-500/20 shadow-4xl">
          <Icons.Cloud />
        </div>
        <h2 className="text-5xl font-black text-white tracking-tighter">Data Control Center</h2>
        <p className="text-slate-400 mt-4 text-xs font-black uppercase tracking-[0.3em]">Your data is 100% private and stored in this browser</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] text-center">
           <div className="text-3xl font-black text-white">{stats.routines}</div>
           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Days Logged</div>
        </div>
        <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] text-center">
           <div className="text-3xl font-black text-white">{stats.targets}</div>
           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Active Missions</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[2.5rem] text-center">
           <div className="text-xs font-black text-emerald-400 uppercase tracking-widest">Storage Status</div>
           <div className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mt-2">Healthy & Local</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Export Card */}
        <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white/5 hover:border-sky-500/30 transition-all group">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-sky-500/10 text-sky-400 rounded-2xl group-hover:bg-sky-500 group-hover:text-white transition-all">
              <Icons.Download />
            </div>
            <h3 className="text-2xl font-black text-white">Export Backup</h3>
          </div>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10">
            Download your entire life archive as a JSON file. Use this to move to another browser or to keep a permanent record.
          </p>
          <button 
            onClick={handleExport}
            className="w-full py-5 bg-sky-600/10 hover:bg-sky-600 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] border border-sky-500/20 transition-all shadow-xl"
          >
            Generate .JSON Archive
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white/5 hover:border-purple-500/30 transition-all group">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl group-hover:bg-purple-500 group-hover:text-white transition-all">
              <Icons.Upload />
            </div>
            <h3 className="text-2xl font-black text-white">Restore Data</h3>
          </div>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10">
            Upload a previously exported Chronos JSON file. Warning: This will overwrite your current local browser data.
          </p>
          <label className="block w-full cursor-pointer">
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            <div className="w-full py-5 bg-purple-600/10 hover:bg-purple-600 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] border border-purple-500/20 transition-all shadow-xl text-center">
              Select Backup File
            </div>
          </label>
        </div>
      </div>

      <div className="mt-20 pt-12 border-t border-white/5 flex flex-col items-center">
        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-8">Safety Zone</h4>
        
        {!showDeleteConfirm ? (
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="text-[10px] font-black text-rose-500/40 hover:text-rose-500 uppercase tracking-widest transition-all"
          >
            Wipe all local data
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4 animate-in zoom-in-95">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Are you absolutely sure? This cannot be undone.</p>
            <div className="flex gap-4">
               <button onClick={clearAllData} className="px-8 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Yes, Delete Everything</button>
               <button onClick={() => setShowDeleteConfirm(false)} className="px-8 py-3 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {status.type !== 'none' && (
        <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 px-10 py-5 rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-4xl animate-in slide-in-from-bottom-10 ${status.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {status.msg}
        </div>
      )}
    </div>
  );
};

export default SyncView;
