// src/components/sitrep/SitRepHistoryViews.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';

export function VersionHistoryTab({ sitrepId, onRollbackPreview }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVersions() {
      setLoading(true);
      const { data, error } = await supabase
        .from('sitrep_versions')
        .select('*')
        .eq('sitrep_id', sitrepId)
        .order('version_number', { ascending: false });

      if (!error) setVersions(data || []);
      setLoading(false);
    }
    fetchVersions();
  }, [sitrepId]);

  if (loading) return <div className="p-6 text-center text-slate-400">Loading version snapshots...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
      <h3 className="text-base font-bold text-slate-900">Version Lifecycle Snapshots</h3>
      <p className="text-xs text-slate-500">
        Every state change generates an immutable snapshot. Previous versions remain preserved.
      </p>

      <div className="divide-y divide-slate-100">
        {versions.map((v) => (
          <div key={v.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-slate-900">
                  Version {v.version_number}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  {v.stage}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{v.version_label}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Saved by {v.created_by_name || 'System'} on {new Date(v.created_at).toLocaleString()}
              </p>
            </div>

            {onRollbackPreview && (
              <button
                type="button"
                onClick={() => onRollbackPreview(v.snapshot_data)}
                className="px-3 py-1.5 border border-slate-300 text-xs font-semibold rounded hover:bg-slate-50"
              >
                Inspect Snapshot
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TransactionHistoryTab({ sitrepId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const { data, error } = await supabase
        .from('sitrep_transaction_history')
        .select('*')
        .eq('sitrep_id', sitrepId)
        .order('created_at', { ascending: false })
        .limit(10); // Query only the last 10 entries to preserve speed

      if (!error) setLogs(data || []);
      setLoading(false);
    }
    fetchLogs();
  }, [sitrepId]);

  if (loading) return <div className="p-6 text-center text-slate-400">Loading audit trail...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-slate-900">Detailed Transaction Audit Trail</h3>
          <p className="text-xs text-slate-500">
            Displaying the last 10 updates (Who, When, Field changed, Previous value, and New value).
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          Showing latest 10
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">User & Role</th>
              <th className="p-3">Dept</th>
              <th className="p-3">Action</th>
              <th className="p-3">Field</th>
              <th className="p-3">Previous Value</th>
              <th className="p-3">New Value</th>
              <th className="p-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400 font-sans">
                  No transactions recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70">
                  <td className="p-3 whitespace-nowrap text-slate-400 font-sans">
                    {new Date(l.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="p-3 font-sans">
                    <div className="font-semibold text-slate-900">{l.user_name}</div>
                    <div className="text-[10px] text-slate-400">{l.user_role}</div>
                  </td>
                  <td className="p-3 font-sans font-semibold text-slate-700">{l.department}</td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                      {l.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700">{l.field_changed || '-'}</td>
                  <td className="p-3 text-rose-600 line-through truncate max-w-xs">{l.previous_value || '—'}</td>
                  <td className="p-3 text-emerald-700 font-bold truncate max-w-xs">{l.new_value || '—'}</td>
                  <td className="p-3 text-slate-500 font-sans">{l.remarks || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}