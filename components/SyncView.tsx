
import React, { useState } from 'react';
import { storageService, cloudService } from '../services/storageService';
import { Icons } from '../constants';

interface SyncViewProps {
  onSyncComplete: () => void;
  userId?: string;
}

const SyncView: React.FC<SyncViewProps> = ({ onSyncComplete, userId }) => {
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'none', msg: string }>({ type: 'none', msg: '' });
  const isCloudAvailable = cloudService.isAvailable();
  
  // Extract project ref from URL for debugging display
  const projectRef = process.env.SUPABASE_URL?.match(/https:\/\/(.*?)\.supabase/)?.[1] || 'Unknown';

  const handleDirectDownload = () => {
    const data = storageService.getRawData(userId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronos_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', msg: 'Backup saved to device!' });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 min-h-screen pb-32">
      <div className="text-center mb-12">
        <div className={`w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border shadow-4xl transition-all duration-700 ${isCloudAvailable ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/40' : 'bg-amber-600/20 text-amber-400 border-amber-500/30 shadow-amber-500/40'}`}>
          <Icons.Cloud />
        </div>
        <h2 className="text-5xl font-black text-white tracking-tighter">
          {isCloudAvailable ? 'Cloud Sync Online' : 'Local Only Mode'}
        </h2>
        {isCloudAvailable && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Linked to: {projectRef}</span>
          </div>
        )}
      </div>

      {!isCloudAvailable && (
        <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/5 p-10 rounded-[3.5rem] mb-12 shadow-4xl animate-in slide-in-from-bottom-8">
           <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-3xl flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                <Icons.Sparkles />
              </div>
              <div className="text-center md:text-left">
                 <h3 className="text-2xl font-black text-white mb-3">Complete your Vercel setup</h3>
                 <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">
                    You need to add your Supabase credentials to your Vercel Project Settings.
                 </p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[10px]">
                    <div className="bg-black/40 p-5 rounded-2xl border border-white/5 flex flex-col gap-2">
                       <span className="text-slate-600 uppercase">Variable 1</span>
                       <span className="text-sky-400 font-black">SUPABASE_URL</span>
                       <span className="text-slate-400 break-all">https://tapbjoaqllhjymtseawn.supabase.co</span>
                    </div>
                    <div className="bg-black/40 p-5 rounded-2xl border border-white/5 flex flex-col gap-2">
                       <span className="text-slate-600 uppercase">Variable 2</span>
                       <span className="text-sky-400 font-black">SUPABASE_ANON_KEY</span>
                       <span className="text-slate-400 truncate">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/5 shadow-2xl hover:border-sky-500/30 transition-all group">
          <div className="p-4 bg-sky-500/10 text-sky-400 rounded-2xl mb-6 w-fit group-hover:bg-sky-500 group-hover:text-white transition-all"><Icons.Download /></div>
          <h3 className="text-2xl font-black text-white mb-3">Hard Backup</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8">
            Download your data as a portable JSON file.
          </p>
          <button onClick={handleDirectDownload} className="w-full py-5 bg-white/5 hover:bg-sky-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] border border-white/5 transition-all">Export JSON</button>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/5 shadow-2xl hover:border-purple-500/30 transition-all group">
          <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl mb-6 w-fit group-hover:bg-purple-500 group-hover:text-white transition-all"><Icons.Upload /></div>
          <h3 className="text-2xl font-black text-white mb-3">Sync Token</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8">
            Manually link this device using an identity token.
          </p>
          <button 
            onClick={() => {
              const token = storageService.exportAllData(userId);
              navigator.clipboard.writeText(token);
              setStatus({ type: 'success', msg: 'Identity Token Copied!' });
            }}
            className="w-full py-5 bg-white/5 hover:bg-purple-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] border border-white/5 transition-all"
          >
            Copy Token
          </button>
        </div>
      </div>

      {status.type !== 'none' && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 px-10 py-5 bg-emerald-600 text-white rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-4xl animate-in slide-in-from-bottom-10">
          {status.msg}
        </div>
      )}
    </div>
  );
};

export default SyncView;
