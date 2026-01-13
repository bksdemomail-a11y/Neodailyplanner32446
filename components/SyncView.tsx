
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { Icons } from '../constants';

interface SyncViewProps {
  onSyncComplete: () => void;
}

const SyncView: React.FC<SyncViewProps> = ({ onSyncComplete }) => {
  const [token, setToken] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'none', msg: string }>({ type: 'none', msg: '' });

  const handleGenerate = () => {
    const newToken = storageService.exportAllData();
    setGeneratedToken(newToken);
    setStatus({ type: 'success', msg: 'Cloud Identity Token Generated' });
  };

  const handleImport = () => {
    if (!token) return;
    const success = storageService.importAllData(token);
    if (success) {
      setStatus({ type: 'success', msg: 'Data Synchronized Successfully' });
      setTimeout(onSyncComplete, 1500);
    } else {
      setStatus({ type: 'error', msg: 'Invalid Sync Token provided' });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedToken);
    setStatus({ type: 'success', msg: 'Copied to Clipboard' });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-cyan-600/20 text-cyan-400 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
          <Icons.Cloud />
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter">Cloud Sync Hub</h2>
        <p className="text-slate-400 font-medium mt-2 uppercase tracking-[0.2em] text-[11px]">Synchronize your profile across all devices</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Export Side */}
        <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/5 text-slate-300 rounded-2xl"><Icons.Upload /></div>
            <h3 className="text-xl font-black text-white">Cloud Backup</h3>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed mb-8 font-medium">
            Generate a secure identity token to move your entire planner history and targets to another browser or device.
          </p>
          
          <div className="mt-auto space-y-4">
            {generatedToken ? (
              <div className="space-y-4 animate-in slide-in-from-bottom-4">
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 break-all text-[9px] font-mono text-cyan-500/70 max-h-32 overflow-y-auto no-scrollbar">
                  {generatedToken}
                </div>
                <button onClick={copyToClipboard} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3">
                  <Icons.Copy /> Copy Sync Token
                </button>
              </div>
            ) : (
              <button onClick={handleGenerate} className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-3xl transition-all">
                Generate Sync Key
              </button>
            )}
          </div>
        </div>

        {/* Import Side */}
        <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/5 text-slate-300 rounded-2xl"><Icons.Download /></div>
            <h3 className="text-xl font-black text-white">Restore Data</h3>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed mb-8 font-medium">
            Paste a token from another device to overwrite your local data with your remote profile.
          </p>
          
          <div className="mt-auto space-y-4">
            <textarea 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token here..."
              className="w-full p-5 bg-black/40 border border-white/5 text-white rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none font-mono text-[10px] h-32 resize-none"
            />
            <button onClick={handleImport} className="w-full py-5 bg-slate-100 hover:bg-white text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-3xl transition-all">
              Merge & Synchronize
            </button>
          </div>
        </div>
      </div>

      {status.type !== 'none' && (
        <div className={`mt-10 p-4 rounded-2xl text-center text-xs font-black uppercase tracking-widest animate-bounce ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {status.msg}
        </div>
      )}
    </div>
  );
};

export default SyncView;
