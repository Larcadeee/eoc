import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { BUTUAN_BARANGAYS } from '../../data/ButuanBarangays';

export default function BCWDSection({ sitrepId, userDepartment, isSupervisor }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('NOT_STARTED');
  const [waterInterrupts, setWaterInterrupts] = useState([]);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const canEdit = isSupervisor || userDepartment === 'BCWD';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sitrep_department_entries')
          .select('*')
          .eq('sitrep_id', sitrepId)
          .eq('department', 'BCWD')
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setStatus(data.status || 'NOT_STARTED');
          const entry = data.data || {};
          setWaterInterrupts(Array.isArray(entry.water_interruptions) ? entry.water_interruptions : []);
        }
      } catch (err) {
        setMsg({ text: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    if (sitrepId) loadData();
  }, [sitrepId]);

  const handleSave = async (newStatus) => {
    setSaving(true);
    setMsg({ text: '', type: '' });
    try {
      const payload = {
        sitrep_id: sitrepId,
        department: 'BCWD',
        status: newStatus,
        data: { water_interruptions: waterInterrupts },
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('sitrep_department_entries')
        .upsert(payload, { onConflict: 'sitrep_id,department' });

      if (error) throw error;
      setStatus(newStatus);
      setMsg({ text: newStatus === 'COMPLETED' ? 'Submitted to Supervisor!' : 'Draft saved.', type: 'success' });
    } catch (err) {
      setMsg({ text: `Failed: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-400">Loading BCWD data...</div>;

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg text-xs font-medium">
          You are viewing the <strong>BCWD</strong> section in read-only mode.
        </div>
      )}

      {msg.text && (
        <div className={`p-3 rounded-lg text-xs font-medium border ${msg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Butuan City Water District (BCWD)</h4>
          <p className="text-xs text-slate-500">Water supply distribution and service outage tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
            {status.replace('_', ' ')}
          </span>
          {canEdit && (
            <div className="flex gap-2">
              <button type="button" onClick={() => handleSave('IN_PROGRESS')} disabled={saving} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold">
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button type="button" onClick={() => handleSave('COMPLETED')} disabled={saving} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm">
                Submit for Review
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h5 className="text-xs font-bold text-slate-800 uppercase">1. Water Supply Disruptions</h5>
          {canEdit && (
            <button type="button" onClick={() => setWaterInterrupts([...waterInterrupts, { barangay: BUTUAN_BARANGAYS[0] || '', status: 'OUTAGE', remarks: '' }])} className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold">
              + Add Water Outage
            </button>
          )}
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-y">
            <tr>
              <th className="p-2">Service Barangay</th>
              <th className="p-2">Supply Status</th>
              <th className="p-2">Action / Remarks</th>
              {canEdit && <th className="p-2 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {waterInterrupts.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-slate-400 italic">Water distribution normal across all zones.</td></tr>
            ) : (
              waterInterrupts.map((w, i) => (
                <tr key={i}>
                  <td className="p-2">
                    {canEdit ? (
                      <select value={w.barangay} onChange={(e) => {
                        const copy = [...waterInterrupts]; copy[i].barangay = e.target.value; setWaterInterrupts(copy);
                      }} className="w-full border rounded p-1 bg-white">
                        {BUTUAN_BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    ) : w.barangay}
                  </td>
                  <td className="p-2">
                    {canEdit ? (
                      <select value={w.status} onChange={(e) => {
                        const copy = [...waterInterrupts]; copy[i].status = e.target.value; setWaterInterrupts(copy);
                      }} className="w-full border rounded p-1 bg-white font-medium">
                        <option value="OUTAGE">INTERRUPTED / LOW PRESSURE</option>
                        <option value="RESTORED">RESTORED</option>
                      </select>
                    ) : w.status}
                  </td>
                  <td className="p-2">
                    {canEdit ? (
                      <input type="text" placeholder="Taguibo River turbidity shutdown" value={w.remarks} onChange={(e) => {
                        const copy = [...waterInterrupts]; copy[i].remarks = e.target.value; setWaterInterrupts(copy);
                      }} className="w-full border rounded p-1" />
                    ) : w.remarks}
                  </td>
                  {canEdit && (
                    <td className="p-2 text-right">
                      <button type="button" onClick={() => setWaterInterrupts(waterInterrupts.filter((_, idx) => idx !== i))} className="text-rose-600 font-bold">✕</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}