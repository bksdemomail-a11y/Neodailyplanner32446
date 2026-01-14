
import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { Icons } from '../constants';

interface SyncViewProps {
  onSyncRefresh: () => void;
  userId?: string;
}

const SyncView: React.FC<SyncViewProps> = ({ onSyncRefresh, userId }) => {
  const [syncKey, setSyncKey] = useState('');
  const [claimInput, setClaimInput] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'none', msg: string }>({ type: 'none', msg: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const stats = useMemo(() => {
    const routines = Object.keys(storageService.getAllRoutines()).length;
    const targets = storageService.getTargets().length;
    return { routines, targets };
  }, []);

  const handleGenerateKey = () => {
    const key = storageService.generateSyncKey();
    setSyncKey(key);
    navigator.clipboard.writeText(key);
    setStatus({ type: 'success', msg: 'Sync Key Copied to Clipboard!' });
    setTimeout(() => setStatus({ type: 'none', msg: '' }), 3000);
  };

  const handleApplyKey = () => {
    if (!claimInput.trim()) {
      setStatus({ type: 'error', msg: 'Please paste a valid Sync Key.' });
      return;
    }

    const success = storageService.applySyncKey(claimInput);
    if (success) {
      setStatus({ type: 'success', msg: 'Temporal Data Synchronized!' });
      setClaimInput('');
      // Trigger a state-only refresh in App.tsx (No browser reload)
      setTimeout(() => {
        onSyncRefresh();
        setStatus({ type: 'none', msg: '' });
      }, 1500);
    } else {
      setStatus({ type: 'error', msg: 'Invalid or Corrupt Sync Key.' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 min-h-screen pb-32 animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="w-20 h-20 bg-sky-600/20 text-sky-400 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-sky-500/20 shadow-4xl">
          <Icons.Cloud />
        </div>
        <h2 className="text-5xl font-black text-white tracking-tighter">Temporal Portal</h2>
        <p className="text-slate-400 mt-4 text-xs font-black uppercase tracking-[0.3em]">No files. No reloads. Pure Sync.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] text-center">
           <div className="text-3xl font-black text-white">{stats.routines}</div>
           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Days Saved</div>
        </div>
        <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] text-center">
           <div className="text-3xl font-black text-white">{stats.targets}</div>
           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Active Goals</div>
        </div>
        <div className="bg-sky-500/10 border border-sky-500/20 p-8 rounded-[2.5rem] text-center">
           <div className="text-xs font-black text-sky-400 uppercase tracking-widest">Protocol</div>
           <div className="text-[10px] font-bold text-sky-500/60 uppercase tracking-widest mt-2">Token-Based Sync</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Generate Key */}
        <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white/5 hover:border-sky-500/30 transition-all group">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-sky-500/10 text-sky-400 rounded-2xl group-hover:bg-sky-500 group-hover:text-white transition-all"><Icons.Copy /></div>
            <h3 className="text-2xl font-black text-white">Export Life</h3>
          </div>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-8">Generate a Sync Key containing your entire schedule. Paste it on another device to continue.</p>
          
          {syncKey ? (
            <div className="space-y-4 animate-in slide-in-from-top-4">
              <textarea readOnly value={syncKey} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-[10px] font-mono text-sky-400/70 h-24 overflow-y-auto no-scrollbar resize-none" />
              <button onClick={handleGenerateKey} className="w-full py-5 bg-sky-600 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl">Copy New Key</button>
            </div>
          ) : (
            <button onClick={handleGenerateKey} className="w-full py-5 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] transition-all">Generate Sync Key</button>
          )}
        </div>

        {/* Claim Key */}
        <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white/5 hover:border-emerald-500/30 transition-all group">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all"><Icons.Upload /></div>
            <h3 className="text-2xl font-black text-white">Import Life</h3>
          </div>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-8">Paste a Sync Key from another device here to restore your routines.</p>
          <div className="space-y-4">
            <textarea 
              value={claimInput} 
              onChange={(e) => setClaimInput(e.target.value)} 
              placeholder="Paste Sync Key here..." 
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-[10px] font-mono text-emerald-400/70 h-24 focus:border-emerald-500 outline-none transition-all" 
            />
            <button onClick={handleApplyKey} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all">Claim Identity</button>
          </div>
        </div>
      </div>

      <div className="mt-20 pt-12 border-t border-white/5 flex flex-col items-center">
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="text-[10px] font-black text-rose-500/40 hover:text-rose-500 uppercase tracking-widest">Destroy Local Vault</button>
        ) : (
          <div className="flex flex-col items-center gap-4 animate-in zoom-in-95">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">This wipes ALL local data. Proceed?</p>
            <div className="flex gap-4">
               <button onClick={() => { localStorage.clear(); onSyncRefresh(); setShowDeleteConfirm(false); }} className="px-8 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase">Wipe Now</button>
               <button onClick={() => setShowDeleteConfirm(false)} className="px-8 py-3 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {status.type !== 'none' && (
        <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 px-10 py-5 rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-4xl animate-in slide-in-from-bottom-10 z-[200] ${status.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {status.msg}
        </div>
      )}
    </div>
  );
};

export default SyncView;
