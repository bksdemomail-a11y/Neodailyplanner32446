
import React, { useState, useMemo, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const routines = Object.keys(storageService.getAllRoutines()).length;
    const targets = storageService.getTargets().length;
    return { routines, targets };
  }, []);

  const handleGenerateKey = () => {
    const key = storageService.generateSyncKey();
    setSyncKey(key);
    navigator.clipboard.writeText(key);
    setStatus({ type: 'success', msg: 'Sync Key Copied!' });
    setTimeout(() => setStatus({ type: 'none', msg: '' }), 3000);
  };

  const handleApplyKey = () => {
    if (!claimInput.trim()) {
      setStatus({ type: 'error', msg: 'Please paste a valid Sync Key.' });
      return;
    }
    const success = storageService.applySyncKey(claimInput);
    if (success) {
      setStatus({ type: 'success', msg: 'Data Synchronized!' });
      setClaimInput('');
      setTimeout(() => { onSyncRefresh(); setStatus({ type: 'none', msg: '' }); }, 1500);
    } else {
      setStatus({ type: 'error', msg: 'Invalid Sync Key.' });
    }
  };

  const handleExportFile = () => {
    const data = {
      routines: storageService.getAllRoutines(),
      targets: storageService.getTargets(),
      templates: storageService.getTemplates(),
      export_date: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronos_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', msg: 'Local Vault Exported!' });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const token = btoa(encodeURIComponent(JSON.stringify(json)));
        const success = storageService.applySyncKey(token);
        if (success) {
          setStatus({ type: 'success', msg: 'Backup Restored!' });
          setTimeout(() => onSyncRefresh(), 1500);
        } else {
          setStatus({ type: 'error', msg: 'Corrupt Backup File.' });
        }
      } catch (err) {
        setStatus({ type: 'error', msg: 'Invalid JSON File.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 min-h-screen pb-40 animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="w-20 h-20 bg-sky-600/20 text-sky-400 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-sky-500/20 shadow-4xl">
          <Icons.Cloud />
        </div>
        <h2 className="text-5xl font-black text-white tracking-tighter">Terminal Hub</h2>
        <p className="text-slate-400 mt-4 text-xs font-black uppercase tracking-[0.3em]">Backup, Sync, and Disaster Recovery</p>
      </div>

      {/* Local Backup Section */}
      <div className="mb-12 bg-emerald-600/10 border border-emerald-500/20 p-10 rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h3 className="text-2xl font-black text-white">Local Vault Backup</h3>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-2">Download your entire life structure as a secure JSON file.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={handleExportFile} className="flex-1 md:flex-none px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2">
            <Icons.Download /> Export
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImportFile} className="hidden" accept=".json" />
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            <Icons.Upload /> Import
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Token Sync - Export */}
        <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white/5 hover:border-sky-500/30 transition-all group">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-sky-500/10 text-sky-400 rounded-2xl group-hover:bg-sky-500 group-hover:text-white transition-all"><Icons.Copy /></div>
            <h3 className="text-2xl font-black text-white">Cloud Token</h3>
          </div>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-8">Generate a one-time sync token for instant cross-device migration.</p>
          {syncKey ? (
            <textarea readOnly value={syncKey} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-[10px] font-mono text-sky-400/70 h-24 mb-4 resize-none" />
          ) : null}
          <button onClick={handleGenerateKey} className="w-full py-5 bg-sky-600 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl">Generate Token</button>
        </div>

        {/* Token Sync - Import */}
        <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white/5 hover:border-emerald-500/30 transition-all group">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all"><Icons.Upload /></div>
            <h3 className="text-2xl font-black text-white">Apply Token</h3>
          </div>
          <textarea 
            value={claimInput} 
            onChange={(e) => setClaimInput(e.target.value)} 
            placeholder="Paste Token Here..." 
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-[10px] font-mono text-emerald-400/70 h-32 focus:border-emerald-500 outline-none transition-all mb-4" 
          />
          <button onClick={handleApplyKey} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all">Restore Identity</button>
        </div>
      </div>

      <div className="mt-20 pt-12 border-t border-white/5 flex flex-col items-center">
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="text-[10px] font-black text-rose-500/40 hover:text-rose-500 uppercase tracking-widest">Self-Destruct Local Vault</button>
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
