// src/pages/admin/AdminDashboard.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-5 border-b border-slate-200">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
              MAIN COMMAND
            </span>
            <span className="text-xs text-slate-500 font-medium">CDRRM-IS Central Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Operations Control Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in as: <strong className="text-slate-800">{profile?.full_name || profile?.email}</strong>
          </p>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            onClick={() => navigate('/supervisor')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              SR
            </div>
            <h3 className="text-sm font-bold text-slate-900">Supervisor Review Desk</h3>
            <p className="text-xs text-slate-500">
              Clearance feed, SitRep approval queue, and verification.
            </p>
          </div>

          <div
            onClick={() => navigate('/encoder')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              EO
            </div>
            <h3 className="text-sm font-bold text-slate-900">Encoder Operations Desk</h3>
            <p className="text-xs text-slate-500">
              Incident creation, situation reports draft intake, and department forms.
            </p>
          </div>

          <div
            onClick={() => navigate('/weather')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              WH
            </div>
            <h3 className="text-sm font-bold text-slate-900">Weather & Hazards</h3>
            <p className="text-xs text-slate-500">
              PAGASA weather monitoring, Doppler radar, and hydrological data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}