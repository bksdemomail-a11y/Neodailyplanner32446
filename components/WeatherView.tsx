
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { Icons } from '../constants';

const WeatherView: React.FC = () => {
  const [weatherData, setWeatherData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const comment = await geminiService.getWeatherAndComment(
            pos.coords.latitude,
            pos.coords.longitude
          );
          setWeatherData(comment);
        } catch (err) {
          setError("Failed to fetch weather insights.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location access denied. Please enable location to use weather features.");
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 h-full overflow-y-auto no-scrollbar pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">Weather Guide</h2>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[11px]">Daily forecast for your schedule</p>
        </div>
        <button 
          onClick={fetchWeather} 
          disabled={loading}
          className="flex items-center gap-3 px-8 py-4 bg-sky-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-sky-500 shadow-3xl transition-all disabled:opacity-50"
        >
          {loading ? 'Consulting Sky...' : <><Icons.Sun /> Refresh Forecast</>}
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-[2rem] p-10 text-center animate-in zoom-in-95">
          <div className="text-rose-500 mb-4 flex justify-center"><Icons.Trash /></div>
          <p className="text-rose-400 font-bold uppercase tracking-widest text-sm">{error}</p>
        </div>
      )}

      {loading && !weatherData && (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <div className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center text-sky-400 mb-6">
            <Icons.Sun />
          </div>
          <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs">Fetching Forecast</p>
        </div>
      )}

      {weatherData && (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 shadow-4xl mb-10 overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
               <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/10"><Icons.Sun /></div>
               <h3 className="text-xl font-black text-white tracking-tighter">আগামী কয়েক দিনের আবহাওয়ার পূর্বাভাস</h3>
            </div>
            
            <div className="prose prose-invert max-w-none text-slate-200">
               <div className="whitespace-pre-wrap font-bold text-lg leading-relaxed space-y-4">
                 {weatherData.split('\n').map((line, i) => (
                   <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                     {line}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherView;
