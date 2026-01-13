
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Template } from '../types';
import { Icons } from '../constants';

interface TemplatesViewProps {
  onApplyTemplate: (template: Template) => void;
}

const TemplatesView: React.FC<TemplatesViewProps> = ({ onApplyTemplate }) => {
  const [templates, setTemplates] = useState<Template[]>([]);

  const loadTemplates = () => {
    setTemplates(storageService.getTemplates());
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const deleteTemplate = (id: string) => {
    storageService.deleteTemplate(id);
    loadTemplates();
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 h-full overflow-y-auto no-scrollbar pb-32">
      <div className="mb-12">
        <h2 className="text-4xl font-black text-white tracking-tight">Day Library</h2>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[11px]">Deploy perfect structures in seconds</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map(t => (
          <div key={t.id} className="bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 flex flex-col group animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-black text-white tracking-tighter">{t.name}</h3>
              <button onClick={() => deleteTemplate(t.id)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Icons.Trash /></button>
            </div>
            <div className="flex-grow space-y-3 mb-8">
              {t.tasks.slice(0, 4).map((task, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_5px_#0ea5e9]" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">{task.title}</span>
                </div>
              ))}
              {t.tasks.length > 4 && <div className="text-[9px] text-slate-600 font-black tracking-widest uppercase">+ {t.tasks.length - 4} More blocks</div>}
            </div>
            <button onClick={() => onApplyTemplate(t)} className="w-full py-4 bg-sky-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-sky-500 shadow-3xl transition-all hover:scale-105 active:scale-95">Apply to Today</button>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-slate-900/20">
            <p className="text-slate-600 font-black uppercase tracking-[0.4em]">Library is empty</p>
            <p className="text-slate-700 text-[10px] mt-2 font-bold uppercase tracking-widest">Save your current routine to the library in the Planner view</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesView;
