import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BUTUAN_BARANGAYS } from '../../data/ButuanBarangays';
import { createVersionSnapshot } from '../../services/sitrepAuditService';

export default function EncoderDashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Calamity Creation Form (CDRRMD / Primary Encoders)
  const [title, setTitle] = useState('');
  const [incidentType, setIncidentType] = useState('FLOOD');
  const [severity, setSeverity] = useState('MODERATE');
  const [initialBarangay, setInitialBarangay] = useState(BUTUAN_BARANGAYS[0] || 'AGAO');
  const [overview, setOverview] = useState('');

  // Department and clearance verification
  const userDept = profile?.department || 'CDRRMD';
  const canCreateDisaster =
    userDept === 'CDRRMD' ||
    profile?.role === 'ADMIN' ||
    profile?.role === 'SUPERVISOR';

  const loadOperationalReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('situation_reports')
        .select(`
          *,
          incidents (id, title, location, severity, incident_type, is_active),
          sitrep_department_entries (id, department, status, updated_at)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Failed to load operational reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperationalReports();
  }, []);

  const handleCreateUnifiedDisaster = async (e) => {
    e.preventDefault();
    if (!canCreateDisaster) return;
    setCreating(true);

    try {
      const { data: incData, error: incErr } = await supabase
        .from('incidents')
        .insert([
          {
            title,
            incident_type: incidentType,
            severity,
            location: initialBarangay,
            description: overview,
            created_by: user.id,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (incErr) throw incErr;

      const nextReportNum = reports.length + 1;
      const { data: repData, error: repErr } = await supabase
        .from('situation_reports')
        .insert([
          {
            incident_id: incData.id,
            report_number: nextReportNum,
            summary: overview || `Initial situational monitoring on ${title}.`,
            affected_families: 0,
            affected_individuals: 0,
            evacuation_centers_active: 0,
            current_version: 1,
            workflow_stage: 'DRAFT',
            status: 'DRAFT',
            encoded_by: user.id,
            last_updated_by: user.id,
          },
        ])
        .select()
        .single();

      if (repErr) throw repErr;

      const depts = ['BARANGAY', 'CSWD', 'CGSD', 'CAVD', 'BCWD', 'PAGASA'];
      await supabase.from('sitrep_department_entries').insert(
        depts.map((d) => ({
          sitrep_id: repData.id,
          department: d,
          status: 'NOT_STARTED',
          data: {},
        }))
      );

      await createVersionSnapshot({
        sitrepId: repData.id,
        currentVersion: 0,
        label: 'Version 1 - Disaster Baseline Initialized',
        stage: 'DRAFT',
        snapshotData: { incident: incData, cases: [], departments: {} },
        user,
        profile,
      });

      navigate(`/sitrep/${repData.id}`);
    } catch (err) {
      alert(`Initialization failed: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const getDepartmentMandate = (dept) => {
    switch (dept) {
      case 'BCWD':
        return 'Responsible for monitoring water supply interruptions, restoration schedules, and pumping station statuses across service barangays.';
      case 'CSWD':
        return 'Responsible for evacuation center headcounts, displaced population demographics, and vulnerable sector needs.';
      case 'CGSD':
        return 'Responsible for road and bridge passability, infrastructure clearance, and electrical power lifeline statuses.';
      case 'CAVD':
        return 'Responsible for monitoring agricultural crop damages, inundation levels, and affected rural sitios.';
      case 'PAGASA':
        return 'Responsible for synoptic weather forecasts, Doppler radar bulletins, and tropical cyclone wind signals.';
      case 'BARANGAY':
        return 'Responsible for ground-level affected families, individuals, and damaged housing counts.';
      default:
        return 'Central Emergency Operations Center field data coordination and report compilation.';
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterStage === 'ALL') return true;
    return r.workflow_stage === filterStage;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center pb-5 border-b border-slate-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                ENCODER DESK
              </span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded uppercase">
                {userDept}
              </span>
              <span className="text-xs text-slate-500 font-medium">CDRRMD EOC Field Intake</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {userDept === 'CDRRMD' ? 'Disaster Operations Workspace' : `${userDept} Agency Data Portal`}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Active Officer: {profile?.full_name || profile?.email} ({userDept})
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Strictly only visible for CDRRMD, Supervisor, or Admin */}
            {canCreateDisaster && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <span>+</span>
                <span>Create New Disaster</span>
              </button>
            )}

            <button
              onClick={signOut}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold rounded-lg text-slate-700 shadow-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

            {/* Agency Mandate Callout */}
<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
  <div>
    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-0.5">
      {userDept} Operational Clearance Scope
    </h2>
    <p className="text-xs text-slate-600">
      {getDepartmentMandate(userDept)}
    </p>
  </div>
  <div className="text-[11px] font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
    Active Section: <span className="font-bold text-blue-700">{userDept} Desk</span>
  </div>
</div>

        {/* Operational KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase text-slate-500">Active Calamity Records</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{reports.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Central Disaster Records</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase text-amber-600">Working Drafts</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {reports.filter((r) => r.workflow_stage === 'DRAFT').length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Continuous field intake</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase text-purple-600">Under Review</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {reports.filter((r) => r.workflow_stage === 'FOR_REVIEW').length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Submitted to Supervisor</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase text-rose-600">Needs Correction</div>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              {reports.filter((r) => r.workflow_stage === 'NEEDS_CORRECTION').length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Supervisor notes pending</div>
          </div>
        </div>

        {/* Central Disaster Roster Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Calamity & SitRep Records</h2>
              <p className="text-xs text-slate-500">Capture once, update continuously, track every change</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Stage:</label>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="ALL">All Records</option>
                <option value="DRAFT">Working Drafts</option>
                <option value="FOR_REVIEW">For Review</option>
                <option value="NEEDS_CORRECTION">Needs Correction</option>
                <option value="APPROVED">Approved</option>
              </select>
              <button
                onClick={loadOperationalReports}
                className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Disaster & SitRep</th>
                  <th className="px-4 py-3.5">Version & Stage</th>
                  <th className="px-4 py-3.5">Department Readiness</th>
                  <th className="px-4 py-3.5">Last Activity</th>
                  <th className="px-5 py-3.5 text-right">Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-slate-400">
                      Loading disaster workspaces...
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-slate-400">
                      No disaster records found.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((r) => {
                    const depts = r.sitrep_department_entries || [];
                    const completedDepts = depts.filter((d) => d.status === 'COMPLETED').length;
                    const completionPct = Math.round((completedDepts / 6) * 100);

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-mono font-bold text-slate-900">
                            SitRep #{r.report_number} • {r.incidents?.incident_type}
                          </div>
                          <div className="font-semibold text-slate-800 text-sm mt-0.5">
                            {r.incidents?.title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {r.incidents?.location} • <span className="font-semibold">{r.incidents?.severity}</span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                              v{r.current_version || 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                r.workflow_stage === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.workflow_stage === 'FOR_REVIEW'
                                  ? 'bg-purple-100 text-purple-800'
                                  : r.workflow_stage === 'NEEDS_CORRECTION'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {(r.workflow_stage || 'DRAFT').replace('_', ' ')}
                            </span>
                          </div>
                          {r.corrections_note && (
                            <p className="text-[11px] text-rose-700 mt-1 line-clamp-1">
                              <strong>Note:</strong> {r.corrections_note}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                            <span>{completedDepts} of 6 Submitted</span>
                            <span>{completionPct}%</span>
                          </div>
                          <div className="w-36 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${completionPct}%` }}
                            />
                          </div>
                          <div className="flex gap-1 mt-1.5 text-[9px] font-mono">
                            {depts.map((d) => (
                              <span
                                key={d.department}
                                title={`${d.department}: ${d.status}`}
                                className={`px-1 rounded ${
                                  d.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : d.status === 'IN_PROGRESS'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {d.department.slice(0, 3)}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                          <div>{new Date(r.updated_at).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(r.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/sitrep/${r.id}`)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors"
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

        {/* Modal: Create Unified Disaster (Strictly Guarded for Authorized Users) */}
        {canCreateDisaster && showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create Unified Disaster Record</h3>
                <p className="text-xs text-slate-500">
                  Initializes the central calamity database entry, baseline SitRep, and initial version tracking.
                </p>
              </div>

              <form onSubmit={handleCreateUnifiedDisaster} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Typhoon Bising / Agusan River Overflow"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Type
                    </label>
                    <select
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                    >
                      <option value="FLOOD">FLOOD</option>
                      <option value="TYPHOON">TYPHOON</option>
                      <option value="LANDSLIDE">LANDSLIDE</option>
                      <option value="EARTHQUAKE">EARTHQUAKE</option>
                      <option value="FIRE">FIRE</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Severity
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MODERATE">MODERATE</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Primary Affected Barangay *
                  </label>
                  <select
                    value={initialBarangay}
                    onChange={(e) => setInitialBarangay(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    {BUTUAN_BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Operational Context & Summary
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter initial situational observations..."
                    value={overview}
                    onChange={(e) => setOverview(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                  >
                    {creating ? 'Initializing...' : 'Initialize & Open Workspace'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}