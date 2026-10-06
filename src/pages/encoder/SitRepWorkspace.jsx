import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';

import BarangaySection from '../../components/sitrep/BarangaySection';
import CSWDSection from '../../components/sitrep/CSWDSection';
import CGSDSection from '../../components/sitrep/CGSDSection';
import CAVDSection from '../../components/sitrep/CAVDSection';
import BCWDSection from '../../components/sitrep/BCWDSection';
import PAGASASection from '../../components/sitrep/PAGASASection';

const DEPARTMENTS = [
  { key: 'BARANGAY', label: 'Barangay', desc: 'Affected Pop. & Houses' },
  { key: 'CSWD', label: 'CSWD', desc: 'Evacuation & Demographics' },
  { key: 'CGSD', label: 'CGSD', desc: 'Roads & Power Lifelines' },
  { key: 'CAVD', label: 'CAVD', desc: 'Flooding & Agriculture' },
  { key: 'BCWD', label: 'BCWD', desc: 'Water Lifeline Outages' },
  { key: 'PAGASA', label: 'PAGASA', desc: 'Weather & Rainfall' }
];

export default function SitRepWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sitrep, setSitrep] = useState(null);
  const [entries, setEntries] = useState({});
  const [activeTab, setActiveTab] = useState('BARANGAY');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Load user profile to detect department
  const [userDept, setUserDept] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchWorkspace();
  }, [id, user]);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);

      // 1. Fetch Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('role, department')
        .eq('auth_user_id', user.id)
        .single();

      setUserRole(prof?.role);
      setUserDept(prof?.department);

      // Default active tab to user's assigned department if encoder
      if (prof?.role === 'ENCODER' && prof?.department && prof.department !== 'CDRRMD') {
        setActiveTab(prof.department);
      }

      // 2. Fetch SitRep master record
      const { data: rep, error: repErr } = await supabase
        .from('situation_reports')
        .select(`*, incidents (title, location)`)
        .eq('id', id)
        .single();

      if (repErr) throw repErr;
      setSitrep(rep);

      // 3. Fetch Department Entries
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

  const handleDataChange = (deptKey, nextData) => {
    setEntries((prev) => ({
      ...prev,
      [deptKey]: {
        ...prev[deptKey],
        data: nextData
      }
    }));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const currentEntry = entries[activeTab];
      const { error } = await supabase
        .from('sitrep_department_entries')
        .update({
          data: currentEntry.data,
          status: 'IN_PROGRESS',
          updated_by: user.id
        })
        .eq('sitrep_id', id)
        .eq('department', activeTab);

      if (error) throw error;
      setStatusMsg({ text: `${activeTab} section draft saved.`, type: 'success' });
      fetchWorkspace();
    } catch (err) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitSection = async () => {
    setSaving(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const currentEntry = entries[activeTab];
      const { error } = await supabase
        .from('sitrep_department_entries')
        .update({
          data: currentEntry.data,
          status: 'COMPLETED',
          submitted_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('sitrep_id', id)
        .eq('department', activeTab);

      if (error) throw error;
      setStatusMsg({ text: `${activeTab} section marked as completed and submitted!`, type: 'success' });
      fetchWorkspace();
    } catch (err) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Determine if active user can edit current tab
  const canEditCurrentTab =
    userRole === 'ADMIN' ||
    userRole === 'SUPERVISOR' ||
    (userRole === 'ENCODER' && userDept === activeTab);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading SitRep Collaborative Workspace...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-semibold text-blue-600 hover:underline mb-1"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              SitRep #{sitrep?.report_number}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              {sitrep?.workflow_status || 'IN PROGRESS'}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            {sitrep?.incidents?.title} • As of {sitrep?.as_of_date || 'Today'}
          </p>
        </div>

        {/* Action Buttons */}
        {canEditCurrentTab && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveDraft}
              className="px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-semibold shadow-sm"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmitSection}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              Submit for Review
            </button>
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {statusMsg.text && (
        <div
          className={`p-3.5 rounded-lg text-sm font-medium ${
            statusMsg.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Department Tabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {DEPARTMENTS.map((dept) => {
          const entry = entries[dept.key];
          const st = entry?.status || 'NOT_STARTED';
          const isSelected = activeTab === dept.key;

          let badgeColor = 'bg-slate-100 text-slate-600';
          if (st === 'COMPLETED') badgeColor = 'bg-emerald-100 text-emerald-700';
          if (st === 'IN_PROGRESS') badgeColor = 'bg-blue-100 text-blue-700';
          if (st === 'NEEDS_CORRECTION') badgeColor = 'bg-amber-100 text-amber-700';

          return (
            <button
              key={dept.key}
              onClick={() => setActiveTab(dept.key)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900">{dept.label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeColor}`}>
                  {st.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">{dept.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Permissions Notice */}
      {!canEditCurrentTab && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg text-xs font-medium">
          You are viewing the <strong>{activeTab}</strong> section in read-only mode. Only assigned {activeTab} encoders or supervisors can edit this section.
        </div>
      )}

      {/* Active Form Section */}
      <div className="pt-2">
        {activeTab === 'BARANGAY' && (
          <BarangaySection
            data={entries['BARANGAY']?.data || {}}
            disabled={!canEditCurrentTab}
            onChange={(d) => handleDataChange('BARANGAY', d)}
          />
        )}
        {activeTab === 'CSWD' && (
          <CSWDSection
            data={entries['CSWD']?.data || {}}
            disabled={!canEditCurrentTab}
            onChange={(d) => handleDataChange('CSWD', d)}
          />
        )}
        {activeTab === 'CGSD' && (
          <CGSDSection
            data={entries['CGSD']?.data || {}}
            disabled={!canEditCurrentTab}
            onChange={(d) => handleDataChange('CGSD', d)}
          />
        )}
        {activeTab === 'CAVD' && (
          <CAVDSection
            data={entries['CAVD']?.data || {}}
            disabled={!canEditCurrentTab}
            onChange={(d) => handleDataChange('CAVD', d)}
          />
        )}
        {activeTab === 'BCWD' && (
          <BCWDSection
            data={entries['BCWD']?.data || {}}
            disabled={!canEditCurrentTab}
            onChange={(d) => handleDataChange('BCWD', d)}
          />
        )}
        {activeTab === 'PAGASA' && (
          <PAGASASection
            data={entries['PAGASA']?.data || {}}
            disabled={!canEditCurrentTab}
            onChange={(d) => handleDataChange('PAGASA', d)}
          />
        )}
      </div>
    </div>
  );
}