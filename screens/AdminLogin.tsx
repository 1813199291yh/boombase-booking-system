
import React, { useState } from 'react';

interface AdminLoginProps {
  onLoginSuccess: (success: boolean) => void;
  onCancel: () => void;
}

import { api } from '../src/api';

// ... (existing imports)

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.login(email, password);
      onLoginSuccess(true);
    } catch (e) {
      setError('Invalid credentials. Access denied.');
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-4 font-manrope">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center size-20 bg-primary rounded-2xl shadow-2xl shadow-primary/30 mb-6">
            <span className="material-symbols-outlined text-white text-4xl font-black">lock_open</span>
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Admin <span className="text-primary">Gate</span></h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Facility Management Portal</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card-dark border border-border-dark p-8 rounded-3xl shadow-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-500 text-xs font-black uppercase tracking-widest animate-shake">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Authorized Email</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background-dark border border-border-dark rounded-xl h-14 pl-12 pr-4 text-white font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="damon@theboombase.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Access Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">key</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background-dark border border-border-dark rounded-xl h-14 pl-12 pr-4 text-white font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-orange-600 text-white h-16 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            Verify Credentials
            <span className="material-symbols-outlined">verified_user</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Cancel and Return Home
          </button>
        </form>

        <p className="mt-8 text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
          Proprietary Facility Management Software <br />
          Unauthorized access is strictly prohibited.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
