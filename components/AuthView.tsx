
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';
import { Icons } from '../constants';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const user = await storageService.loginUser(username, password);
        if (user) {
          onAuthSuccess(user);
        } else {
          setError('Invalid username or password on this device.');
        }
      } else {
        const user = storageService.registerUser(username, password);
        if (user) {
          await storageService.loginUser(username, password);
          onAuthSuccess(user);
        } else {
          setError('Username already exists');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleImportToken = () => {
    setError('');
    const success = storageService.importAllData(tokenInput);
    if (success) {
      setSuccess('Identity Synced! You can now log in.');
      setIsImporting(false);
      setIsLogin(true);
      setTokenInput('');
    } else {
      setError('Invalid Identity Token. Please check the source.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 shadow-4xl animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-sky-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-sky-500/20">
            <Icons.Calendar />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            {isImporting ? 'Sync Identity' : isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-slate-400 font-medium mt-2">
            {isImporting 
              ? 'Paste the token from your other device' 
              : isLogin ? 'Manage your time, achieve your goals' 
              : 'Start your journey to high performance'}
          </p>
        </div>

        {isImporting ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Identity Token</label>
              <textarea
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste your long Identity Token here..."
                className="w-full px-6 py-5 bg-black/40 border border-white/5 text-white rounded-3xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-mono text-[10px] h-32"
              />
            </div>
            <button
              onClick={handleImportToken}
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-3xl transition-all"
            >
              Verify & Link Account
            </button>
            <button
              onClick={() => setIsImporting(false)}
              className="w-full text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold text-center animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold text-center animate-in fade-in slide-in-from-top-2">
                {success}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Username</label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">
                  <Icons.User />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your unique name"
                  className="w-full pl-14 pr-6 py-5 bg-black/40 border border-white/5 text-white rounded-3xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Password</label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">
                  <Icons.Lock />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-14 pr-6 py-5 bg-black/40 border border-white/5 text-white rounded-3xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-5 bg-sky-600 hover:bg-sky-500 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-3xl hover:scale-[1.02] active:scale-95 transition-all mt-4"
            >
              {isLogin ? 'Login to Chronos' : 'Join the Elite'}
            </button>
          </form>
        )}

        <div className="mt-10 flex flex-col gap-4 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setIsImporting(false);
              setError('');
              setSuccess('');
            }}
            className="text-slate-500 hover:text-sky-400 text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already a member? Sign In"}
          </button>
          
          <button
            onClick={() => {
              setIsImporting(true);
              setError('');
            }}
            className="text-sky-500/60 hover:text-sky-400 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <Icons.Cloud /> Sync Identity from Another Device
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
