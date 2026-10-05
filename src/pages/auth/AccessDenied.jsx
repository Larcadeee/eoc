import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AccessDenied() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-red-200 rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          ✕
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-sm text-slate-600 mt-2">
          You do not have administrative or operational privileges to view this section, or your account has been deactivated.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            to="/"
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Return to Authorized Home
          </Link>
          <button
            onClick={() => signOut()}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}