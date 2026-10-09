// src/pages/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. If user is already authenticated or just logged in, forward immediately
  useEffect(() => {
    if (!authLoading && user) {
      const role = (profile?.role || '').toUpperCase();
      if (role === 'SUPERVISOR' || role === 'ADMIN') {
        navigate('/supervisor', { replace: true });
      } else {
        navigate('/encoder', { replace: true });
      }
    }
  }, [user, profile, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const { data, error } = await signIn({ email, password });
      if (error) throw error;
      // The useEffect above will handle redirection once the auth state updates
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-xs font-semibold text-slate-400">
        Verifying CDRRMD portal session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-1">
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center font-black text-white text-lg shadow-md mb-2">
            BX
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">CDRRMD EOC Portal</h1>
          <p className="text-xs text-slate-400">Butuan City Disaster Risk Reduction & Management</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg text-xs font-medium bg-rose-950/50 border border-rose-800/80 text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. officer@butuan.gov.ph"
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In to Operations Desk'}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Restricted System • CDRRMD Command & Control Center
          </p>
        </div>
      </div>
    </div>
  );
}