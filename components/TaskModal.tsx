
import React, { useState, useEffect } from 'react';
import { TimeBlock, COLORS, CATEGORIES, TaskCategory } from '../types';
import { Icons } from '../constants';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: TimeBlock) => void;
  onDelete?: (id: string) => void;
  initialTask?: Partial<TimeBlock>;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, onDelete, initialTask }) => {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [category, setCategory] = useState<TaskCategory>(initialTask?.category || 'Work');
  const [color, setColor] = useState(initialTask?.color || COLORS[0].hex);
  const [reminder, setReminder] = useState(initialTask?.reminder || false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || '');
      setCategory(initialTask.category || 'Work');
      setColor(initialTask.color || COLORS[0].hex);
      setReminder(initialTask.reminder || false);
    }
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || initialTask?.startTime === undefined || initialTask?.endTime === undefined) return;
    onSave({
      id: initialTask?.id || crypto.randomUUID(),
      title,
      category,
      startTime: initialTask.startTime,
      endTime: initialTask.endTime,
      color,
      completed: initialTask?.completed || false,
      reminder,
    });
    onClose();
  };

  const formatTime = (t?: number) => {
    if (t === undefined) return '';
    const h = Math.floor(t) % 24;
    const m = Math.round((t % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-white/10 rounded-[3rem] shadow-4xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit} className="p-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">{initialTask?.id ? 'Refine Plan' : 'New Plan'}</h2>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">
                {formatTime(initialTask?.startTime)} — {formatTime(initialTask?.endTime)}
              </p>
            </div>
            {initialTask?.id && onDelete && (
              <button type="button" onClick={() => onDelete(initialTask.id!)} className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all">
                <Icons.Trash />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">What's the goal?</label>
                <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Deep Work..." className="w-full px-6 py-4 bg-black/40 border border-white/5 text-white rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none text-xl font-bold" required />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button" onClick={() => setCategory(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${category === cat ? 'bg-sky-600 border-sky-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
               <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Visual Theme</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map((c) => (
                      <button key={c.hex} type="button" onClick={() => setColor(c.hex)} className={`w-10 h-10 rounded-full border-4 transition-all ${c.bg} ${color === c.hex ? 'ring-4 ring-sky-500/20 border-white scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`} />
                    ))}
                  </div>
               </div>

               <div className="flex items-center justify-between bg-black/20 p-5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${reminder ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-500'}`}><Icons.Sparkles /></div>
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Auto-Reminder</span>
                  </div>
                  <button type="button" onClick={() => setReminder(!reminder)} className={`w-12 h-6 rounded-full relative transition-all ${reminder ? 'bg-sky-500' : 'bg-slate-800'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${reminder ? 'left-7' : 'left-1'}`} />
                  </button>
               </div>
            </div>
          </div>

          <div className="flex gap-4 mt-12">
            <button type="button" onClick={onClose} className="flex-grow py-5 text-slate-400 font-black uppercase text-[11px] tracking-widest bg-white/5 hover:bg-white/10 rounded-2xl transition-all">Discard</button>
            <button type="submit" className="flex-grow py-5 text-white font-black uppercase text-[11px] tracking-widest bg-sky-600 hover:bg-sky-500 rounded-2xl shadow-3xl transition-all">Commit to Day</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
