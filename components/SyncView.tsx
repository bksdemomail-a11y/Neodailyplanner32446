
import React, { useState, useRef } from 'react';
import { storageService } from '../services/storageService';
import { Icons } from '../constants';

interface SyncViewProps {
  onSyncComplete: () => void;
}

const SyncView: React.FC<SyncViewProps> = ({ onSyncComplete }) => {
  const [token, setToken] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'none', msg: string }>({ type: 'none', msg: '' });
  const [isWorkspaceSynced, setIsWorkspaceSynced] = useState(storageService.getIsSynced());
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFileSystemSupported = 'showOpenFilePicker' in window && window.isSecureContext;

  const handleLinkWorkspace = async () => {
    try {
      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Chronos Backup File', accept: { 'application/json': ['.json'] } }],
        multiple: false
      });
      const success = await storageService.setWorkspaceHandle(handle);
      if (success) {
        setIsWorkspaceSynced(true);
        setStatus({ type: 'success', msg: 'Workspace Linked!' });
        setTimeout(onSyncComplete, 1000);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setStatus({ type: 'error', msg: 'System denied file access. Use "Direct Backup" instead.' });
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = storageService.importAllData(btoa(content));
        if (success) {
          setStatus({ type: 'success', msg: 'Restored from ' + file.name });
          setTimeout(onSyncComplete, 1200);
        }
      } catch (err) {
        setStatus({ type: 'error', msg: 'Invalid backup file format.' });
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/json" || file.name.endsWith('.json')) {
      processFile(file);
    } else {
      setStatus({ type: 'error', msg: 'Please drop a .json backup file.' });
    }
  };

  const handleDirectDownload = () => {
    const data = storageService.getRawData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronos_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', msg: 'File Saved! Keep this file safe.' });
  };

  return (
    <div 
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`max-w-4xl mx-auto py-12 px-6 min-h-screen transition-all duration-300 ${isDragging ? 'bg-sky-500/10 scale-[0.99] rounded-[4rem]' : ''}`}
    >
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-emerald-600/20 text-emerald-400 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
          <Icons.Cloud />
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter">Backup & Restore</h2>
        <p className="text-slate-400 font-medium mt-2 uppercase tracking-[0.2em] text-[11px]">Secure your data against browser refreshes</p>
      </div>

      {/* Recommended Method: Direct File Backup (Because of Sandbox) */}
      <div className="bg-slate-900/60 backdrop-blur-3xl p-12 rounded-[4rem] border-2 border-sky-500/30 mb-12 shadow-4xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity"><Icons.Download /></div>
        
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="bg-sky-500/20 text-sky-400 p-4 rounded-3xl mb-6"><Icons.Sparkles /></div>
          <h3 className="text-3xl font-black text-white mb-4">Direct Device Backup</h3>
          <p className="text-slate-400 text-xs font-bold leading-relaxed mb-10 max-w-md mx-auto">
            Since your browser blocks "Auto-Saving" for privacy, use this button to 
            <span className="text-white"> download a backup file</span> to your computer. 
            To get your data back, just drag that file anywhere on this screen.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
            <button 
              onClick={handleDirectDownload}
              className="flex-grow py-6 bg-sky-600 hover:bg-sky-500 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-3xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Icons.Download /> Save Data to Device
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-grow py-6 bg-white/5 hover:bg-white/10 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest border border-white/5 transition-all flex items-center justify-center gap-3"
            >
              <Icons.Upload /> Restore from File
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
          </div>
        </div>

        {isDragging && (
          <div className="absolute inset-4 border-4 border-dashed border-sky-500/50 rounded-[3rem] bg-sky-500/5 backdrop-blur-sm flex items-center justify-center z-50 animate-pulse">
            <p className="text-sky-400 font-black uppercase tracking-[0.4em] text-xl">Drop File to Restore</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        {/* Method 2: Automatic Workspace (Restricted Info) */}
        <div className={`bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 opacity-40 grayscale flex flex-col`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-slate-800 text-slate-500 rounded-xl"><Icons.Video /></div>
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Automatic Sync</h4>
          </div>
          <p className="text-[9px] text-slate-600 font-bold leading-relaxed">
            Direct folder access is restricted in this preview. This feature works in standard browsers to auto-save files silently.
          </p>
        </div>

        {/* Method 3: Token Sync (The Cloud Choice) */}
        <div className="bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-2 bg-white/5 text-slate-500 rounded-xl"><Icons.Copy /></div>
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Identity Token</h4>
          </div>
          <button 
            onClick={() => {
              const newToken = storageService.exportAllData();
              setGeneratedToken(newToken);
              navigator.clipboard.writeText(newToken);
              setStatus({type: 'success', msg: 'Token Copied to Clipboard!'});
            }} 
            className="w-full py-4 bg-white/5 text-slate-400 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
          >
            {generatedToken ? 'Token Copied!' : 'Copy Identity Token'}
          </button>
        </div>
      </div>

      {status.type !== 'none' && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 p-6 rounded-[2rem] text-center text-[11px] font-black uppercase tracking-widest shadow-4xl animate-in slide-in-from-bottom-4 ${status.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-rose-600 text-white shadow-rose-500/20'}`}>
          {status.msg}
        </div>
      )}
    </div>
  );
};

export default SyncView;
