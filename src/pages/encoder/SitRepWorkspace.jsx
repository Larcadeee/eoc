// src/pages/encoder/SitRepWorkspace.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';
import IncidentCasesTable from '../../components/sitrep/IncidentCasesTable';
import { VersionHistoryTab, TransactionHistoryTab } from '../../components/sitrep/SitRepHistoryViews';
import SitRepDocument from '../../components/sitrep/SitRepDocument';
import { logTransaction, createVersionSnapshot } from '../../services/sitrepAuditService';

// Department Subsections
import BarangaySection from '../../components/sitrep/BarangaySection';
import CSWDSection from '../../components/sitrep/CSWDSection';
import CGSDSection from '../../components/sitrep/CGSDSection';
import CAVDSection from '../../components/sitrep/CAVDSection';
import BCWDSection from '../../components/sitrep/BCWDSection';
import PAGASASection from '../../components/sitrep/PAGASASection';

export default function SitRepWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [sitrep, setSitrep] = useState(null);
  const [cases, setCases] = useState([]);
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('CASES'); // 'CASES' | 'DEPARTMENTS' | 'PREVIEW' | 'VERSIONS' | 'AUDIT'
  const [selectedDeptTab, setSelectedDeptTab] = useState('BARANGAY');
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const isSupervisor = profile?.role === 'SUPERVISOR' || profile?.role === 'ADMIN';

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      // 1. Fetch Master SitRep & Incident
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

      // Auto-focus user's assigned department tab
      if (profile?.department && profile.department !== 'CDRRMD') {
        setSelectedDeptTab(profile.department);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [id]);

  // Save Working Draft & Persist Incident Cases
  const handleSaveDraft = async () => {
    setSaving(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const totalFam = cases.reduce((acc, c) => acc + (Number(c.family) || 0), 0);
      const totalInd = cases.reduce((acc, c) => acc + (Number(c.individual) || 0), 0);

      // 1. Update Situation Report Master Record
      await supabase
        .from('situation_reports')
        .update({
          affected_families: totalFam,
          affected_individuals: totalInd,
          last_updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      // 2. Persist Incident Cases
      if (cases.length > 0) {
        const rowsToSave = cases.map((c) => ({
          ...c,
          sitrep_id: id,
          incident_id: sitrep.incident_id,
          created_by: c.created_by || user.id
        }));

        await supabase.from('incident_cases').upsert(rowsToSave);
      }

      // 3. Log Audit
      await logTransaction({
        sitrepId: id,
        incidentId: sitrep.incident_id,
        versionNumber: sitrep.current_version,
        user,
        profile,
        action: 'SAVED_DRAFT',
        remarks: 'Encoder saved continuous working draft'
      });

      setStatusMsg({ text: 'Working data saved successfully.', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: `Save failed: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Submit for Review & Bump to New Version Snapshot
  const handleSubmitForReview = async () => {
    if (cases.length === 0) {
      if (!window.confirm('No granular incident cases recorded. Submit anyway?')) return;
    }

    setSaving(true);
    try {
      const nextVer = await createVersionSnapshot({
        sitrepId: id,
        currentVersion: sitrep.current_version || 1,
        label: `Version ${(sitrep.current_version || 1) + 1} - Submitted for Supervisor Clearance`,
        stage: 'FOR_REVIEW',
        snapshotData: {
          sitrep,
          cases,
          entries,
          submitted_at: new Date().toISOString()
        },
        user,
        profile
      });

      await supabase
        .from('situation_reports')
        .update({
          workflow_stage: 'FOR_REVIEW',
          status: 'SUBMITTED',
          last_updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      setStatusMsg({ text: `SitRep advanced to Version ${nextVer} and submitted for Supervisor review.`, type: 'success' });
      loadWorkspace();
    } catch (err) {
      setStatusMsg({ text: `Submission failed: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Supervisor Action: Return for Correction
  const handleReturnForCorrection = async () => {
    const note = prompt('Specify what information or metrics need correction:');
    if (!note) return;

    setSaving(true);
    try {
      await supabase
        .from('situation_reports')
        .update({
          workflow_stage: 'NEEDS_CORRECTION',
          corrections_note: note,
          status: 'DRAFT',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      await logTransaction({
        sitrepId: id,
        incidentId: sitrep.incident_id,
        versionNumber: sitrep.current_version,
        user,
        profile,
        action: 'RETURNED_FOR_CORRECTION',
        remarks: note
      });

      setStatusMsg({ text: 'Report returned to Encoders with correction instructions.', type: 'success' });
      loadWorkspace();
    } catch (err) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Supervisor Action: Approve SitRep
  const handleApproveSitRep = async () => {
    setSaving(true);
    try {
      const nextVer = await createVersionSnapshot({
        sitrepId: id,
        currentVersion: sitrep.current_version,
        label: `Version ${sitrep.current_version + 1} - Official Supervisor Approved Version`,
        stage: 'APPROVED',
        snapshotData: { sitrep, cases, entries, approved_at: new Date().toISOString() },
        user,
        profile
      });

      await supabase
        .from('situation_reports')
        .update({
          workflow_stage: 'APPROVED',
          status: 'APPROVED',
          final_approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', id);

      setStatusMsg({ text: `SitRep officially approved as Version ${nextVer}.`, type: 'success' });
      loadWorkspace();
    } catch (err) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Disaster Workspace...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8 print:p-0 print:bg-white">
      <div className="max-w-7xl mx-auto space-y-6 print:max-w-none print:m-0 print:space-y-0">
        
        {/* Top Control Bar - HIDDEN ON PRINT */}
        <header className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 print:hidden">
          <div>
            <button onClick={() => navigate(-1)} className="text-xs font-semibold text-blue-600 hover:underline mb-1">
              ← Back to Reports
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">
                SitRep #{sitrep?.report_number}: {sitrep?.incidents?.title}
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
              Location: <strong>{sitrep?.incidents?.location}</strong> • Calamity Type: <strong>{sitrep?.incidents?.incident_type}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-3.5 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Save Working Draft'}
            </button>

            {sitrep?.workflow_stage !== 'APPROVED' && (
              <button
                onClick={handleSubmitForReview}
                disabled={saving}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Submit for Review →
              </button>
            )}

            {isSupervisor && (
              <>
                {sitrep?.workflow_stage !== 'APPROVED' && (
                  <button
                    onClick={handleReturnForCorrection}
                    disabled={saving}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Return for Correction
                  </button>
                )}
                {sitrep?.workflow_stage !== 'APPROVED' && (
                  <button
                    onClick={handleApproveSitRep}
                    disabled={saving}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    Approve SitRep
                  </button>
                )}
              </>
            )}
          </div>
        </header>

        {/* Correction Notice Banner - HIDDEN ON PRINT */}
        {sitrep?.workflow_stage === 'NEEDS_CORRECTION' && sitrep?.corrections_note && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-start gap-3 print:hidden">
            <span className="text-base font-bold">⚠️</span>
            <div>
              <p className="font-bold uppercase tracking-wider">Supervisor Correction Notice</p>
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

        {/* Workspace Navigation Tabs - HIDDEN ON PRINT */}
        <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl gap-2 overflow-x-auto text-xs font-bold print:hidden">
          <button
            onClick={() => setActiveTab('CASES')}
            className={`py-3 px-3.5 border-b-2 transition-colors ${
              activeTab === 'CASES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            1. Incident & Case Intake ({cases.length})
          </button>
          <button
            onClick={() => setActiveTab('DEPARTMENTS')}
            className={`py-3 px-3.5 border-b-2 transition-colors ${
              activeTab === 'DEPARTMENTS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            2. Department Contributions
          </button>
          <button
            onClick={() => setActiveTab('PREVIEW')}
            className={`py-3 px-3.5 border-b-2 transition-colors ${
              activeTab === 'PREVIEW' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            3. DROMIC SitRep Preview & PDF
          </button>
          <button
            onClick={() => setActiveTab('VERSIONS')}
            className={`py-3 px-3.5 border-b-2 transition-colors ${
              activeTab === 'VERSIONS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            4. Version History
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`py-3 px-3.5 border-b-2 transition-colors ${
              activeTab === 'AUDIT' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            5. Transaction Audit Trail
          </button>
        </div>

        {/* Tab 1: Incident & Case Intake */}
        {activeTab === 'CASES' && (
          <IncidentCasesTable
            cases={cases}
            setCases={setCases}
            sitrepId={id}
            incidentId={sitrep?.incident_id}
            currentVersion={sitrep?.current_version}
            user={user}
            profile={profile}
            readOnly={sitrep?.workflow_stage === 'APPROVED' && !isSupervisor}
          />
        )}

        {/* Tab 2: Department Contributions */}
        {activeTab === 'DEPARTMENTS' && (
          <div className="space-y-4">
            <div className="flex gap-2 border-b border-slate-200 pb-2 bg-white p-3 rounded-lg text-xs font-semibold overflow-x-auto">
              {['BARANGAY', 'CSWD', 'CGSD', 'CAVD', 'BCWD', 'PAGASA'].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDeptTab(dept)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    selectedDeptTab === dept
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {selectedDeptTab === 'BARANGAY' && (
              <BarangaySection
                sitrepId={id}
                userDepartment={profile?.department}
                isSupervisor={isSupervisor}
              />
            )}
            {selectedDeptTab === 'CSWD' && (
              <CSWDSection
                sitrepId={id}
                userDepartment={profile?.department}
                isSupervisor={isSupervisor}
              />
            )}
            {selectedDeptTab === 'CGSD' && (
              <CGSDSection
                sitrepId={id}
                userDepartment={profile?.department}
                isSupervisor={isSupervisor}
              />
            )}
            {selectedDeptTab === 'CAVD' && (
              <CAVDSection
                sitrepId={id}
                userDepartment={profile?.department}
                isSupervisor={isSupervisor}
              />
            )}
            {selectedDeptTab === 'BCWD' && (
              <BCWDSection
                sitrepId={id}
                userDepartment={profile?.department}
                isSupervisor={isSupervisor}
              />
            )}
            {selectedDeptTab === 'PAGASA' && (
              <PAGASASection
                sitrepId={id}
                userDepartment={profile?.department}
                isSupervisor={isSupervisor}
              />
            )}
          </div>
        )}

        {/* Tab 3: Official SitRep Preview & Print */}
        {activeTab === 'PREVIEW' && (
          <div className="space-y-4">
            <div className="flex justify-end print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Print / Export SitRep PDF
              </button>
            </div>
            <SitRepDocument
              sitrep={sitrep}
              entries={entries}
              currentUser={profile || user}
            />
          </div>
        )}

        {/* Tab 4: Version History */}
        {activeTab === 'VERSIONS' && <VersionHistoryTab sitrepId={id} />}

        {/* Tab 5: Audit Trail */}
        {activeTab === 'AUDIT' && <TransactionHistoryTab sitrepId={id} />}
      </div>
    </div>
  );
}