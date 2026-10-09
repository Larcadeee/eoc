// src/pages/supervisor/SupervisorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [filterStage, setFilterStage] = useState('ALL');

  const loadSupervisorData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Incidents
      const { data: incidentData, error: incError } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (incError) throw incError;
      setIncidents(incidentData || []);

      // 2. Fetch Situation Reports with Incident Relations
      const { data: repData, error: repError } = await supabase
        .from('situation_reports')
        .select(`
          *,
          incidents (title, location, severity, incident_type)
        `)
        .order('created_at', { ascending: false });

      if (repError) throw repError;
      setReports(repData || []);
    } catch (err) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupervisorData();
  }, []);

  const filteredReports = reports.filter((r) => {
    if (filterStage === 'ALL') return true;
    return (r.workflow_stage || r.status) === filterStage;
  });

  const totalFamilies = reports
    .filter((r) => r.workflow_stage === 'APPROVED' || r.status === 'PUBLISHED')
    .reduce((acc, curr) => acc + (curr.affected_families || 0), 0);

  const totalIndividuals = reports
    .filter((r) => r.workflow_stage === 'APPROVED' || r.status === 'PUBLISHED')
    .reduce((acc, curr) => acc + (curr.affected_individuals || 0), 0);

  const pendingReviewCount = reports.filter(
    (r) => r.workflow_stage === 'FOR_REVIEW' || r.status === 'SUBMITTED'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center pb-5 border-b border-slate-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded">
                SUPERVISOR
              </span>
              <span className="text-xs text-slate-500 font-medium">CDRRMD Incident Command Desk</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">EOC Operations Review Desk</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervising Officer: <strong className="text-slate-800">{profile?.full_name || profile?.email}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="self-start sm:self-auto px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold rounded-lg text-slate-700 shadow-sm transition-colors"
          >
            Sign Out
          </button>
        </header>

        {statusMsg.text && (
          <div
            className={`p-3.5 rounded-lg text-xs font-medium border ${
              statusMsg.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase text-slate-500">Awaiting Clearance</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{pendingReviewCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Submitted by encoders</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase text-slate-500">Active Incidents</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {incidents.filter((i) => i.is_active).length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Monitored areas</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase text-slate-500">Affected Families</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{totalFamilies.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Approved SitRep totals</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase text-slate-500">Displaced Persons</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{totalIndividuals.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Cumulative verified headcount</div>
          </div>
        </div>

        {/* SitRep Clearance Review Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Situation Reports Clearance Feed</h2>
              <p className="text-xs text-slate-500">
                Validate encoder intake, review department data, and manage DROMIC SitReps
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Filter:</label>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="ALL">All Reports ({reports.length})</option>
                <option value="FOR_REVIEW">For Review (Submitted)</option>
                <option value="APPROVED">Approved</option>
                <option value="NEEDS_CORRECTION">Needs Correction</option>
                <option value="DRAFT">Draft</option>
              </select>
              <button
                type="button"
                onClick={loadSupervisorData}
                className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Report & Incident</th>
                  <th className="px-4 py-3.5">Summary / Ground Report</th>
                  <th className="px-4 py-3.5">Affected Counts</th>
                  <th className="px-4 py-3.5">Stage & Version</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-slate-400">
                      Loading reports for review...
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-slate-400">
                      No reports match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((r) => {
                    const currentStage = r.workflow_stage || r.status || 'DRAFT';
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">
                              SitRep #{r.report_number}
                            </span>
                            <span className="px-1.5 py-0.2 font-mono text-[10px] bg-slate-100 text-slate-700 rounded border">
                              v{r.current_version || 1}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-800 mt-1">{r.incidents?.title}</div>
                          <div className="text-[11px] text-slate-400">
                            {r.incidents?.location} •{' '}
                            <span className="font-semibold text-slate-600">{r.incidents?.severity}</span>
                          </div>
                        </td>

                        <td className="px-4 py-4 max-w-sm">
                          <p className="text-slate-700 line-clamp-2 leading-relaxed">
                            {r.summary || 'No summary recorded.'}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                            Logged: {new Date(r.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-slate-900 font-medium">
                            <strong>{(r.affected_families || 0).toLocaleString()}</strong> families
                          </div>
                          <div className="text-slate-600">
                            <strong>{(r.affected_individuals || 0).toLocaleString()}</strong> persons
                          </div>
                          <div className="text-[11px] text-slate-400">
                            <strong>{r.evacuation_centers_active || 0}</strong> active ECs
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              currentStage === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : currentStage === 'FOR_REVIEW'
                                ? 'bg-purple-100 text-purple-800'
                                : currentStage === 'NEEDS_CORRECTION'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {currentStage.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/sitrep/${r.id}`);
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Open Workspace</span>
                            <span>&rarr;</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}