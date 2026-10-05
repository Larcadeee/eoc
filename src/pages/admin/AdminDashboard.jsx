import React from 'react';
import { useAuth } from '../../context/AuthContext';
import UserManagement from './UserManagement';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">ADMIN</span>
              <span className="text-xs text-slate-500 font-medium">CDRRMD EOC Control Desk</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Administrator Console</h1>
            <p className="text-xs text-slate-500 mt-0.5">Signed in as {profile?.full_name || profile?.email}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={signOut}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold rounded-lg text-slate-700 shadow-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* User Governance Component */}
        <UserManagement/>
      </div>
    </div>
  );
}