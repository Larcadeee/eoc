import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { BUTUAN_BARANGAYS } from '../../data/ButuanBarangays';

export default function CAVDSection({ sitrepId, userDepartment, isSupervisor }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('NOT_STARTED');
  const [floodedAreas, setFloodedAreas] = useState([]);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const canEdit = isSupervisor || userDepartment === 'CAVD';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sitrep_department_entries')
          .select('*')
          .eq('sitrep_id', sitrepId)
          .eq('department', 'CAVD')
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setStatus(data.status || 'NOT_STARTED');
          const entry = data.data || {};
          setFloodedAreas(Array.isArray(entry.flooded_areas) ? entry.flooded_areas : []);
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
        department: 'CAVD',
        status: newStatus,
        data: { flooded_areas: floodedAreas },
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

  if (loading) return <div className="p-6 text-center text-slate-400">Loading CAVD data...</div>;

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg text-xs font-medium">
          You are viewing the <strong>CAVD</strong> section in read-only mode.
        </div>
      )}

      {msg.text && (
        <div className={`p-3 rounded-lg text-xs font-medium border ${msg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h4 className="text-sm font-bold text-slate-900">City Agriculture and Veterinary Department (CAVD)</h4>
          <p className="text-xs text-slate-500">Inundation levels, agricultural damage, and affected sitios</p>
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
          <h5 className="text-xs font-bold text-slate-800 uppercase">1. Inundation & Agricultural Sector Damage</h5>
          {canEdit && (
            <button type="button" onClick={() => setFloodedAreas([...floodedAreas, { barangay: BUTUAN_BARANGAYS[0] || '', sitio: '', water_level: 'KNEE DEEP', agri_damage_cost: 0, remarks: '' }])} className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold">
              + Add Incident Area
            </button>
          )}
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-y">
            <tr>
              <th className="p-2">Barangay</th>
              <th className="p-2">Sitio / Area</th>
              <th className="p-2">Water Level</th>
              <th className="p-2 text-right">Agri Damage (PHP)</th>
              <th className="p-2">Remarks</th>
              {canEdit && <th className="p-2 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {floodedAreas.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-slate-400 italic">No agricultural/flood damage recorded.</td></tr>
            ) : (
              floodedAreas.map((f, i) => (
                <tr key={i}>
                  <td className="p-2">
                    {canEdit ? (
                      <select value={f.barangay} onChange={(e) => {
                        const copy = [...floodedAreas]; copy[i].barangay = e.target.value; setFloodedAreas(copy);
                      }} className="w-full border rounded p-1 bg-white">
                        {BUTUAN_BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    ) : f.barangay}
                  </td>
                  <td className="p-2">
                    {canEdit ? (
                      <input type="text" placeholder="Sitio Riverside" value={f.sitio} onChange={(e) => {
                        const copy = [...floodedAreas]; copy[i].sitio = e.target.value; setFloodedAreas(copy);
                      }} className="w-full border rounded p-1" />
                    ) : f.sitio}
                  </td>
                  <td className="p-2">
                    {canEdit ? (
                      <input type="text" placeholder="Ankle / Knee / Waist Deep" value={f.water_level} onChange={(e) => {
                        const copy = [...floodedAreas]; copy[i].water_level = e.target.value; setFloodedAreas(copy);
                      }} className="w-full border rounded p-1" />
                    ) : f.water_level}
                  </td>
                  <td className="p-2 text-right font-mono">
                    {canEdit ? (
                      <input type="number" min="0" value={f.agri_damage_cost} onChange={(e) => {
                        const copy = [...floodedAreas]; copy[i].agri_damage_cost = Number(e.target.value); setFloodedAreas(copy);
                      }} className="w-24 border rounded p-1 text-right font-mono" />
                    ) : f.agri_damage_cost?.toLocaleString()}
                  </td>
                  <td className="p-2">
                    {canEdit ? (
                      <input type="text" placeholder="Corn crops inundated" value={f.remarks} onChange={(e) => {
                        const copy = [...floodedAreas]; copy[i].remarks = e.target.value; setFloodedAreas(copy);
                      }} className="w-full border rounded p-1" />
                    ) : f.remarks}
                  </td>
                  {canEdit && (
                    <td className="p-2 text-right">
                      <button type="button" onClick={() => setFloodedAreas(floodedAreas.filter((_, idx) => idx !== i))} className="text-rose-600 font-bold">✕</button>
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