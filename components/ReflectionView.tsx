
import React, { useState, useEffect } from 'react';
import { DailyRoutine } from '../types';
import { Icons } from '../constants';

interface ReflectionViewProps {
  routine: DailyRoutine;
  onUpdate: (routine: DailyRoutine) => void;
  onNotification: (msg: string, type: 'info' | 'success') => void;
  onBack: () => void;
}

const ReflectionView: React.FC<ReflectionViewProps> = ({ routine, onUpdate, onNotification, onBack }) => {
  const [noteInput, setNoteInput] = useState(routine.notes || '');
  const [mediaUrlInput, setMediaUrlInput] = useState('');

  const saveNotes = () => {
    onUpdate({ ...routine, notes: noteInput });
    onNotification('Deep Reflection Recorded', 'success');
  };

  const addMediaLink = () => {
    if (!mediaUrlInput) return;
    const mediaLinks = routine.mediaLinks ? [...routine.mediaLinks, mediaUrlInput] : [mediaUrlInput];
    onUpdate({ ...routine, mediaLinks });
    setMediaUrlInput('');
    onNotification('Memory Log Added', 'success');
  };

  const removeMediaLink = (index: number) => {
    const mediaLinks = routine.mediaLinks?.filter((_, i) => i !== index);
    onUpdate({ ...routine, mediaLinks });
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/file\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  };

  return (
    <div className="min-h-full bg-slate-950/20 backdrop-blur-3xl p-6 sm:p-12 overflow-y-auto no-scrollbar pb-32 animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-16">
          <button 
            onClick={onBack}
            className="group flex items-center gap-3 px-6 py-3 bg-white/5 text-slate-400 rounded-2xl hover:text-white hover:bg-white/10 transition-all border border-white/5"
          >
            <Icons.ChevronLeft />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Back to Planner</span>
          </button>
          <div className="text-right">
            <h2 className="text-4xl font-black text-white tracking-tighter leading-none">Day Reflection</h2>
            <p className="text-sky-500 font-black uppercase tracking-[0.4em] text-[9px] mt-2">The Archive of {routine.date}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12">
          {/* Writing Section */}
          <div className="bg-white/5 border border-white/5 rounded-[3rem] p-8 sm:p-12 shadow-4xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-sky-600/40" />
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.6em]">Daily Transcript</h3>
               <button 
                onClick={saveNotes}
                className="px-8 py-3 bg-sky-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-500 shadow-3xl transition-all"
               >
                 Commit to Memory
               </button>
            </div>
            <textarea 
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              placeholder="Start writing... How did you grow today? What will you remember in 10 years?"
              className="w-full bg-transparent text-xl sm:text-2xl font-medium text-slate-100 placeholder:text-slate-800 outline-none resize-none min-h-[400px] leading-relaxed selection:bg-sky-500/30"
            />
          </div>

          {/* Media Section */}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.6em]">Media Logs</h3>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">Videos and photos of the journey</p>
              </div>
              <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5 flex-grow max-w-md">
                <input 
                  type="text"
                  value={mediaUrlInput}
                  onChange={e => setMediaUrlInput(e.target.value)}
                  placeholder="Paste Google Drive Link..."
                  className="flex-grow bg-transparent px-4 text-[11px] text-white outline-none font-bold"
                />
                <button 
                  onClick={addMediaLink}
                  className="p-3 bg-sky-600 text-white rounded-xl hover:bg-sky-500 transition-all"
                >
                  <Icons.Plus />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {routine.mediaLinks?.map((link, idx) => (
                <div key={idx} className="relative aspect-video group rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl bg-black">
                  <iframe 
                    src={getEmbedUrl(link)}
                    className="w-full h-full pointer-events-none"
                    title={`Media Log ${idx}`}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                    <div className="flex gap-4">
                       <a href={link} target="_blank" rel="noopener noreferrer" className="p-4 bg-white/10 rounded-full hover:bg-white text-slate-900 transition-all shadow-xl">
                          <Icons.Video />
                       </a>
                       <button 
                        onClick={() => removeMediaLink(idx)}
                        className="p-4 bg-rose-600/20 text-rose-500 rounded-full hover:bg-rose-600 hover:text-white transition-all shadow-xl"
                       >
                          <Icons.Trash />
                       </button>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-6 text-[8px] font-black text-white/40 uppercase tracking-[0.4em] pointer-events-none">
                     Log #{idx + 1}
                  </div>
                </div>
              ))}
              
              {(!routine.mediaLinks || routine.mediaLinks.length === 0) && (
                <div className="col-span-full py-20 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center opacity-20">
                   <div className="mb-4"><Icons.Video /></div>
                   <p className="text-[9px] font-black uppercase tracking-[0.5em]">No Visual Memories Recorded</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReflectionView;
