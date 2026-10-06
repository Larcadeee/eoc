import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import SitRepDocument from '../../components/sitrep/SitRepDocument';

const DEPARTMENTS = ['BARANGAY', 'CSWD', 'CGSD', 'CAVD', 'BCWD', 'PAGASA'];

export default function SupervisorSitRepReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sitrep, setSitrep] = useState(null);
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('review'); // 'review' | 'preview'
  const [selectedDept, setSelectedDept] = useState(null);
  const [correctionNote, setCorrectionNote] = useState('');
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReviewData();
  }, [id]);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      const { data: rep, error: repErr } = await supabase
        .from('situation_reports')
        .select(`*, incidents (title, location)`)
        .eq('id', id)
        .single();

      if (repErr) throw repErr;
      setSitrep(rep);

      const { data: entryRows, error: entryErr } = await supabase
        .from('sitrep_department_entries')
        .select('*')
        .eq('sitrep_id', id);

      if (entryErr) throw entryErr;

      const map = {};
      entryRows.forEach((r) => {
        map[r.department] = r;
      });
      setEntries(map);
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReturnSection = async (deptKey) => {
    if (!correctionNote.trim()) {
      alert('Please enter a note explaining what needs correction.');
      return;
    }
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('sitrep_department_entries')
        .update({
          status: 'NEEDS_CORRECTION',
          corrections_note: correctionNote
        })
        .eq('sitrep_id', id)
        .eq('department', deptKey);

      if (error) throw error;
      setStatusMsg({ text: `${deptKey} section returned for correction.`, type: 'success' });
      setSelectedDept(null);
      setCorrectionNote('');
      fetchReviewData();
    } catch (err) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveSitRep = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('situation_reports')
        .update({
          workflow_status: 'APPROVED',
          status: 'APPROVED',
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      setStatusMsg({ text: 'SitRep successfully approved!', type: 'success' });
      fetchReviewData();
    } catch (err) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading Supervisor Review Workspace...</div>;
  }

  const allCompleted = DEPARTMENTS.every((d) => entries[d]?.status === 'COMPLETED');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <button onClick={() => navigate(-1)} className="text-xs font-semibold text-blue-600 hover:underline mb-1">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            Supervisor Review Desk: SitRep #{sitrep?.report_number}
          </h1>
          <p className="text-sm text-slate-600">{sitrep?.incidents?.title}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView(activeView === 'review' ? 'preview' : 'review')}
            className="px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50"
          >
            {activeView === 'review' ? 'Preview SitRep Document' : 'View Department Checklist'}
          </button>

          {activeView === 'preview' && (
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900"
            >
              Print / Export PDF
            </button>
          )}

          {sitrep?.workflow_status !== 'APPROVED' && (
            <button
              onClick={handleApproveSitRep}
              disabled={updating || !allCompleted}
              className={`px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm ${
                allCompleted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              {allCompleted ? 'Approve SitRep' : 'Awaiting Submissions'}
            </button>
          )}
        </div>
      </div>

      {statusMsg.text && (
        <div
          className={`p-3.5 rounded-lg text-sm font-medium print:hidden ${
            statusMsg.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Review View */}
      {activeView === 'review' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Department Submission Status Checklist</h2>
            <div className="divide-y divide-slate-100">
              {DEPARTMENTS.map((dept) => {
                const entry = entries[dept];
                const st = entry?.status || 'NOT_STARTED';

                let badge = 'bg-slate-100 text-slate-600';
                if (st === 'COMPLETED') badge = 'bg-emerald-100 text-emerald-700';
                if (st === 'IN_PROGRESS') badge = 'bg-blue-100 text-blue-700';
                if (st === 'NEEDS_CORRECTION') badge = 'bg-amber-100 text-amber-700';

                return (
                  <div key={dept} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{dept}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${badge}`}>
                          {st.replace('_', ' ')}
                        </span>
                      </div>
                      {entry?.corrections_note && (
                        <p className="text-xs text-amber-700 mt-1">
                          <strong>Supervisor Note:</strong> {entry.corrections_note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/sitrep/${id}?dept=${dept}`)}
                        className="px-3 py-1.5 border border-slate-300 text-xs font-semibold rounded hover:bg-slate-50"
                      >
                        Inspect Section
                      </button>
                      <button
                        onClick={() => setSelectedDept(dept)}
                        className="px-3 py-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-semibold rounded"
                      >
                        Return for Correction
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Return for Correction Modal */}
          {selectedDept && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Return {selectedDept} Section for Correction
                </h3>
                <textarea
                  rows={4}
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  placeholder="Specify what numbers or data need revision by this department encoder..."
                  className="w-full border rounded-lg p-2.5 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedDept(null)}
                    className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReturnSection(selectedDept)}
                    disabled={updating}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold"
                  >
                    Confirm Return
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Preview Document View */
        <SitRepDocument sitrep={sitrep} entries={entries} />
      )}
    </div>
  );
}