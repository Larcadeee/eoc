import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';

export default function SupervisorDashboard() {
  const { user, profile, signOut } = useAuth();
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Load all reports and incidents
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

      // 2. Fetch all Situation Reports with incident details
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

  // Update report review status (e.g. APPROVED, PUBLISHED, DRAFT)
  const handleUpdateReportStatus = async (reportId, nextStatus) => {
    setStatusMsg({ text: '', type: '' });
    try {
      const { data, error } = await supabase
        .from('situation_reports')
        .update({
          status: nextStatus,
          reviewed_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Database RLS blocked the update. Check account permissions.');
      }

      setStatusMsg({
        text: `Report status updated to ${nextStatus}.`,
        type: 'success',
      });
      loadSupervisorData();
    } catch (err) {
      console.error('Update error:', err);
      setStatusMsg({ text: err.message || 'Failed to update report status.', type: 'error' });
    }
  };

  // Toggle active status on an Incident
  const handleToggleIncidentStatus = async (incidentId, currentActive) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({
          is_active: !currentActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', incidentId);

      if (error) throw error;

      loadSupervisorData();
    } catch (err) {
      setStatusMsg({ text: err.message, type: 'error' });
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  // Calculate Operational Metrics
  const totalFamilies = reports
    .filter((r) => r.status === 'PUBLISHED' || r.status === 'APPROVED')
    .reduce((acc, curr) => acc + (curr.affected_families || 0), 0);

  const totalIndividuals = reports
    .filter((r) => r.status === 'PUBLISHED' || r.status === 'APPROVED')
    .reduce((acc, curr) => acc + (curr.affected_individuals || 0), 0);

  const pendingReviewCount = reports.filter((r) => r.status === 'SUBMITTED').length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center pb-5 border-b border-slate-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded">
                SUPERVISOR
              </span>
              <span className="text-xs text-slate-500 font-medium">CDRRMD Incident Command</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">EOC Operations Review Desk</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervising Officer: {profile?.full_name || profile?.email}
            </p>
          </div>
          <button
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

        {/* Operational KPI Cards */}
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
            <div className="text-2xl font-bold text-slate-800 mt-1">{totalFamilies}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Approved / Published logs</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase text-slate-500">Displaced Persons</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{totalIndividuals}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Cumulative verified head count</div>
          </div>
        </div>

        {/* SitRep Review Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Situation Reports Clearance Feed</h2>
              <p className="text-xs text-slate-500">Validate encoder intake, approve operational stats, and publish</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Filter:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="ALL">All Reports ({reports.length})</option>
                <option value="SUBMITTED">Submitted (Pending Review)</option>
                <option value="APPROVED">Approved</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
              <button
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
                  <th className="px-5 py-3.5">Report # & Incident</th>
                  <th className="px-4 py-3.5">Summary / Ground Report</th>
                  <th className="px-4 py-3.5">Affected Counts</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Clearance Actions</th>
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
                  filteredReports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono font-bold text-slate-900">SitRep #{r.report_number}</div>
                        <div className="font-semibold text-slate-800 mt-0.5">{r.incidents?.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {r.incidents?.location} •{' '}
                          <span className="font-semibold text-slate-600">{r.incidents?.severity}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 max-w-sm">
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{r.summary}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          Logged: {new Date(r.created_at).toLocaleString()}
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-slate-900 font-medium">
                          <strong>{r.affected_families}</strong> families
                        </div>
                        <div className="text-slate-600">
                          <strong>{r.affected_individuals}</strong> individuals
                        </div>
                        <div className="text-[11px] text-slate-400">
                          <strong>{r.evacuation_centers_active}</strong> open centers
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            r.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : r.status === 'APPROVED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : r.status === 'SUBMITTED'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                        {r.status === 'SUBMITTED' && (
                          <>
                            <button
                              onClick={() => handleUpdateReportStatus(r.id, 'APPROVED')}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateReportStatus(r.id, 'PUBLISHED')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                            >
                              Publish
                            </button>
                            <button
                              onClick={() => handleUpdateReportStatus(r.id, 'DRAFT')}
                              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-medium transition-colors"
                            >
                              Return
                            </button>
                          </>
                        )}

                        {r.status === 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateReportStatus(r.id, 'PUBLISHED')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                          >
                            Publish to Viewers
                          </button>
                        )}

                        {r.status === 'PUBLISHED' && (
                          <button
                            onClick={() => handleUpdateReportStatus(r.id, 'APPROVED')}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-medium transition-colors"
                          >
                            Unpublish
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}