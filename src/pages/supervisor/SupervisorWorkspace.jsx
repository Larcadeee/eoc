// src/pages/supervisor/SupervisorWorkspace.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';
import ButuanDisasterMap from '../../components/map/ButuanDisasterMap';
import SitRepDocument from '../../components/sitrep/SitRepDocument';
import { VersionHistoryTab, TransactionHistoryTab } from '../../components/sitrep/SitRepHistoryViews';
import { logTransaction, createVersionSnapshot } from '../../services/sitrepAuditService';

export default function SupervisorWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [sitrep, setSitrep] = useState(null);
  const [cases, setCases] = useState([]);
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('MAP'); // 'MAP' | 'REVIEW' | 'CASES' | 'VERSIONS' | 'AUDIT'
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const loadWorkspaceData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Situation Report and Master Incident
      const { data: rep, error: repErr } = await supabase
        .from('situation_reports')
        .select(`*, incidents (*)`)
        .eq('id', id)
        .single();

      if (repErr) throw repErr;
      setSitrep(rep);

      // 2. Fetch Granular Incident Cases
      const { data: caseRows, error: caseErr } = await supabase
        .from('incident_cases')
        .select('*')
        .eq('sitrep_id', id)
        .order('created_at', { ascending: true });

      if (!caseErr) setCases(caseRows || []);

      // 3. Fetch Department Contributions
      const { data: entryRows, error: entryErr } = await supabase
        .from('sitrep_department_entries')
        .select('*')
        .eq('sitrep_id', id);

      if (!entryErr) {
        const map = {};
        entryRows.forEach((r) => {
          map[r.department] = r;
        });
        setEntries(map);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [id]);

  // Supervisor Action: Return for Correction
  const handleReturnForCorrection = async () => {
    const note = prompt('Specify what information or metrics need correction:');
    if (!note) return;

    setProcessing(true);
    try {
      await supabase
        .from('situation_reports')
        .update({
          workflow_stage: 'NEEDS_CORRECTION',
          corrections_note: note,
          status: 'DRAFT',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      await logTransaction({
        sitrepId: id,
        incidentId: sitrep.incident_id,
        versionNumber: sitrep.current_version,
        user,
        profile,
        action: 'RETURNED_FOR_CORRECTION',
        remarks: note,
      });

      setStatusMsg({
        text: 'Report returned to Encoders with correction instructions.',
        type: 'success',
      });
      loadWorkspaceData();
    } catch (err) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  // Supervisor Action: Officially Approve & Publish SitRep
  const handleApproveSitRep = async () => {
    if (!window.confirm('Confirm official approval of this SitRep?')) return;

    setProcessing(true);
    try {
      const nextVer = await createVersionSnapshot({
        sitrepId: id,
        currentVersion: sitrep.current_version || 1,
        label: `Version ${(sitrep.current_version || 1) + 1} - Official Supervisor Approved Version`,
        stage: 'APPROVED',
        snapshotData: { sitrep, cases, entries, approved_at: new Date().toISOString() },
        user,
        profile,
      });

      await supabase
        .from('situation_reports')
        .update({
          workflow_stage: 'APPROVED',
          status: 'APPROVED',
          final_approved_at: new Date().toISOString(),
          approved_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      setStatusMsg({
        text: `SitRep officially approved and finalized as Version ${nextVer}.`,
        type: 'success',
      });
      loadWorkspaceData();
    } catch (err) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading Supervisor Workspace...</div>;
  }

  const totalFam = cases.reduce((sum, c) => sum + (Number(c.family) || 0), 0);
  const totalInd = cases.reduce((sum, c) => sum + (Number(c.individual) || 0), 0);
  const completedDepts = Object.values(entries).filter((e) => e.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8 print:p-0 print:bg-white font-sans">
      <div className="max-w-7xl mx-auto space-y-6 print:max-w-none print:m-0 print:space-y-0">
        
        {/* Supervisor Top Action Bar - HIDDEN ON PRINT */}
        <header className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 print:hidden">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-xs font-semibold text-blue-600 hover:underline mb-1"
            >
              ← Back to Supervisor Roster
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">
                Supervisor Desk • SitRep #{sitrep?.report_number}: {sitrep?.incidents?.title}
              </h1>
              <span className="font-mono font-bold text-xs px-2.5 py-0.5 bg-blue-50 text-blue-800 rounded border border-blue-200">
                v{sitrep?.current_version || 1}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  sitrep?.workflow_stage === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : sitrep?.workflow_stage === 'FOR_REVIEW'
                    ? 'bg-purple-100 text-purple-800'
                    : sitrep?.workflow_stage === 'NEEDS_CORRECTION'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {(sitrep?.workflow_stage || 'DRAFT').replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Location: <strong>{sitrep?.incidents?.location}</strong> • Calamity Type:{' '}
              <strong>{sitrep?.incidents?.incident_type}</strong> • Clearance:{' '}
              <strong className="text-blue-700">{completedDepts} of 6 Agencies Completed</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {sitrep?.workflow_stage !== 'APPROVED' && (
              <>
                <button
                  onClick={handleReturnForCorrection}
                  disabled={processing}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  Return for Correction
                </button>
                <button
                  onClick={handleApproveSitRep}
                  disabled={processing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Approve SitRep
                </button>
              </>
            )}
          </div>
        </header>

        {/* Correction Feedback Notice - HIDDEN ON PRINT */}
        {sitrep?.workflow_stage === 'NEEDS_CORRECTION' && sitrep?.corrections_note && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-start gap-3 print:hidden">
            <span className="text-base font-bold">⚠️</span>
            <div>
              <p className="font-bold uppercase tracking-wider">Active Supervisor Correction Note</p>
              <p className="mt-0.5 text-rose-700 leading-relaxed">{sitrep.corrections_note}</p>
            </div>
          </div>
        )}

        {statusMsg.text && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border print:hidden ${
              statusMsg.type === 'error'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Navigation Tabs - HIDDEN ON PRINT */}
        <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl gap-2 overflow-x-auto text-xs font-bold print:hidden">
          <button
            onClick={() => setActiveTab('MAP')}
            className={`py-3 px-3.5 border-b-2 transition-colors ${
              activeTab === 'MAP'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            🗺️ Operational GIS Map
          </button>
          <button
            onClick={() => setActiveTab('REVIEW')}
            className={`py-3 px-3.5 border-b-2 transition-colors ${
              activeTab === 'REVIEW'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            DROMIC SitRep Review & PDF
          </button>
          <button
            onClick={() => setActiveTab('CASES')}
            className={`py-3 px-3.5 border-b-2 transition-colors ${
              activeTab === 'CASES'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Granular Cases Roster ({cases.length})
          </button>
          <button
            onClick={() => setActiveTab('VERSIONS')}
            className={`py-3 px-3.5 border-b-2 transition-colors ${
              activeTab === 'VERSIONS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Version History
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`py-3 px-3.5 border-b-2 transition-colors ${
              activeTab === 'AUDIT'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Audit Trail (Last 10)
          </button>
        </div>

        {/* TAB 1: OPERATIONAL GIS MAP */}
        {activeTab === 'MAP' && (
          <div className="space-y-4 print:hidden">
            {/* KPI Cards Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 block uppercase text-[10px] font-semibold">Incident Type</span>
                <span className="font-bold text-slate-900 text-sm">{sitrep?.incidents?.incident_type || 'TYPHOON'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 block uppercase text-[10px] font-semibold">Plotted Incident Hotspots</span>
                <span className="font-bold text-blue-700 text-sm">{cases.length} Entries</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 block uppercase text-[10px] font-semibold">Displaced Families</span>
                <span className="font-bold text-purple-700 text-sm">{totalFam.toLocaleString()}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 block uppercase text-[10px] font-semibold">Displaced Individuals</span>
                <span className="font-bold text-emerald-700 text-sm">{totalInd.toLocaleString()}</span>
              </div>
            </div>

            {/* Boundary.json Interactive Leaflet Map */}
            <ButuanDisasterMap cases={cases} />
          </div>
        )}

        {/* TAB 2: DROMIC REVIEW & EXPORT */}
        {activeTab === 'REVIEW' && (
          <div className="space-y-4">
            <div className="flex justify-end print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Print / Export SitRep PDF
              </button>
            </div>
            <SitRepDocument sitrep={sitrep} entries={entries} currentUser={profile || user} />
          </div>
        )}

        {/* TAB 3: CASES ROSTER READ-ONLY VIEW */}
        {activeTab === 'CASES' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Submitted Granular Incident Cases</h3>
              <span className="text-xs text-slate-500">Read-Only Clearance Review</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 font-bold border-b text-slate-700">
                  <tr>
                    <th className="p-2.5">Case ID</th>
                    <th className="p-2.5">Barangay</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5 text-right">Families</th>
                    <th className="p-2.5 text-right">Individuals</th>
                    <th className="p-2.5">Evac Center</th>
                    <th className="p-2.5">Coordinates</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-400">No cases recorded.</td>
                    </tr>
                  ) : (
                    cases.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50/70">
                        <td className="p-2.5 font-mono font-bold text-slate-900">{c.case_number}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{c.barangay}</td>
                        <td className="p-2.5">{c.case_of}</td>
                        <td className="p-2.5 text-right font-mono font-bold">{c.family}</td>
                        <td className="p-2.5 text-right font-mono">{c.individual}</td>
                        <td className="p-2.5">{c.evacuation_center || 'None'}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-500">
                          {c.latitude ? `${c.latitude}, ${c.longitude}` : 'No GPS'}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: VERSION HISTORY */}
        {activeTab === 'VERSIONS' && <VersionHistoryTab sitrepId={id} />}

        {/* TAB 5: AUDIT TRAIL */}
        {activeTab === 'AUDIT' && <TransactionHistoryTab sitrepId={id} />}

      </div>
    </div>
  );
}