import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { BUTUAN_BARANGAYS } from '../../data/ButuanBarangays';

export default function CSWDSection({ sitrepId, userDepartment, isSupervisor }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('NOT_STARTED');
  const [insideEcs, setInsideEcs] = useState([]);
  const [ageDist, setAgeDist] = useState({
    infants_m: 0, infants_f: 0,
    children_m: 0, children_f: 0,
    adults_m: 0, adults_f: 0,
    seniors_m: 0, seniors_f: 0
  });
  const [sectorDist, setSectorDist] = useState({
    pregnant: 0, lactating: 0, pwds: 0, solo_parents: 0, indigenous: 0
  });
  const [msg, setMsg] = useState({ text: '', type: '' });

  const canEdit = isSupervisor || userDepartment === 'CSWD';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sitrep_department_entries')
          .select('*')
          .eq('sitrep_id', sitrepId)
          .eq('department', 'CSWD')
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setStatus(data.status || 'NOT_STARTED');
          const entry = data.data || {};
          setInsideEcs(Array.isArray(entry.inside_ecs) ? entry.inside_ecs : []);
          if (entry.age_distribution) setAgeDist(entry.age_distribution);
          if (entry.sector_breakdown) setSectorDist(entry.sector_breakdown);
        }
      } catch (err) {
        console.error(err);
        setMsg({ text: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    if (sitrepId) loadData();
  }, [sitrepId]);

  const handleAddEc = () => {
    setInsideEcs([
      ...insideEcs,
      {
        ec_name: '',
        location_barangay: BUTUAN_BARANGAYS[0] || '',
        families_cum: 0, families_now: 0,
        persons_cum: 0, persons_now: 0,
        origin_barangay: BUTUAN_BARANGAYS[0] || '',
        remarks: ''
      }
    ]);
  };

  const handleSave = async (newStatus) => {
    setSaving(true);
    setMsg({ text: '', type: '' });
    try {
      const payload = {
        sitrep_id: sitrepId,
        department: 'CSWD',
        status: newStatus,
        data: {
          inside_ecs: insideEcs,
          age_distribution: ageDist,
          sector_breakdown: sectorDist
        },
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('sitrep_department_entries')
        .upsert(payload, { onConflict: 'sitrep_id,department' });

      if (error) throw error;
      setStatus(newStatus);
      setMsg({
        text: newStatus === 'COMPLETED' ? 'Submitted to Supervisor!' : 'Draft saved.',
        type: 'success'
      });
    } catch (err) {
      setMsg({ text: `Failed: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-400">Loading CSWD data...</div>;

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg text-xs font-medium">
          You are viewing the <strong>CSWD</strong> section in read-only mode.
        </div>
      )}

      {msg.text && (
        <div className={`p-3 rounded-lg text-xs font-medium border ${msg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {msg.text}
        </div>
      )}

      {/* Control Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h4 className="text-sm font-bold text-slate-900">City Social Welfare and Development (CSWD)</h4>
          <p className="text-xs text-slate-500">Evacuation center tracking and displaced population demographics</p>
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

      {/* Evacuation Centers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h5 className="text-xs font-bold text-slate-800 uppercase">1. Evacuation Centers (Inside ECs)</h5>
          {canEdit && (
            <button type="button" onClick={handleAddEc} className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold">
              + Add EC
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-y border-slate-200">
              <tr>
                <th className="p-2">EC Name / Location</th>
                <th className="p-2">Barangay</th>
                <th className="p-2 w-20 text-right">Fam Cum</th>
                <th className="p-2 w-20 text-right">Fam Now</th>
                <th className="p-2 w-20 text-right">Per Cum</th>
                <th className="p-2 w-20 text-right">Per Now</th>
                <th className="p-2">Origin</th>
                {canEdit && <th className="p-2 w-12 text-right"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {insideEcs.length === 0 ? (
                <tr><td colSpan={8} className="p-4 text-center text-slate-400 italic">No evacuation centers registered.</td></tr>
              ) : (
                insideEcs.map((ec, i) => (
                  <tr key={i}>
                    <td className="p-2">
                      {canEdit ? (
                        <input type="text" placeholder="e.g. Butuan Gym" value={ec.ec_name} onChange={(e) => {
                          const copy = [...insideEcs]; copy[i].ec_name = e.target.value; setInsideEcs(copy);
                        }} className="w-full border border-slate-300 rounded px-2 py-1" />
                      ) : ec.ec_name}
                    </td>
                    <td className="p-2">
                      {canEdit ? (
                        <select value={ec.location_barangay} onChange={(e) => {
                          const copy = [...insideEcs]; copy[i].location_barangay = e.target.value; setInsideEcs(copy);
                        }} className="w-full border border-slate-300 rounded px-2 py-1 bg-white">
                          {BUTUAN_BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      ) : ec.location_barangay}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {canEdit ? (
                        <input type="number" min="0" value={ec.families_cum} onChange={(e) => {
                          const copy = [...insideEcs]; copy[i].families_cum = Number(e.target.value); setInsideEcs(copy);
                        }} className="w-16 border border-slate-300 rounded px-1 text-right" />
                      ) : ec.families_cum}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {canEdit ? (
                        <input type="number" min="0" value={ec.families_now} onChange={(e) => {
                          const copy = [...insideEcs]; copy[i].families_now = Number(e.target.value); setInsideEcs(copy);
                        }} className="w-16 border border-slate-300 rounded px-1 text-right" />
                      ) : ec.families_now}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {canEdit ? (
                        <input type="number" min="0" value={ec.persons_cum} onChange={(e) => {
                          const copy = [...insideEcs]; copy[i].persons_cum = Number(e.target.value); setInsideEcs(copy);
                        }} className="w-16 border border-slate-300 rounded px-1 text-right" />
                      ) : ec.persons_cum}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {canEdit ? (
                        <input type="number" min="0" value={ec.persons_now} onChange={(e) => {
                          const copy = [...insideEcs]; copy[i].persons_now = Number(e.target.value); setInsideEcs(copy);
                        }} className="w-16 border border-slate-300 rounded px-1 text-right" />
                      ) : ec.persons_now}
                    </td>
                    <td className="p-2">
                      {canEdit ? (
                        <select value={ec.origin_barangay} onChange={(e) => {
                          const copy = [...insideEcs]; copy[i].origin_barangay = e.target.value; setInsideEcs(copy);
                        }} className="w-full border border-slate-300 rounded px-2 py-1 bg-white">
                          {BUTUAN_BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      ) : ec.origin_barangay}
                    </td>
                    {canEdit && (
                      <td className="p-2 text-right">
                        <button type="button" onClick={() => setInsideEcs(insideEcs.filter((_, idx) => idx !== i))} className="text-rose-600 font-bold">✕</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demographics Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          <h5 className="text-xs font-bold text-slate-800 uppercase">2. Age Profile of Evacuees</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {['infants', 'children', 'adults', 'seniors'].map((cat) => (
              <div key={cat} className="p-2 border rounded-lg bg-slate-50">
                <span className="font-bold capitalize text-slate-700">{cat}:</span>
                <div className="flex gap-2 mt-1">
                  <input type="number" min="0" placeholder="M" disabled={!canEdit} value={ageDist[`${cat}_m`] || 0} onChange={(e) => setAgeDist({ ...ageDist, [`${cat}_m`]: Number(e.target.value) })} className="w-1/2 p-1 border rounded text-right font-mono" />
                  <input type="number" min="0" placeholder="F" disabled={!canEdit} value={ageDist[`${cat}_f`] || 0} onChange={(e) => setAgeDist({ ...ageDist, [`${cat}_f`]: Number(e.target.value) })} className="w-1/2 p-1 border rounded text-right font-mono" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          <h5 className="text-xs font-bold text-slate-800 uppercase">3. Vulnerable Sectors</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.keys(sectorDist).map((k) => (
              <div key={k} className="p-2 border rounded-lg bg-slate-50 flex items-center justify-between">
                <span className="font-medium text-slate-700 uppercase text-[10px]">{k.replace('_', ' ')}</span>
                <input type="number" min="0" disabled={!canEdit} value={sectorDist[k] || 0} onChange={(e) => setSectorDist({ ...sectorDist, [k]: Number(e.target.value) })} className="w-16 p-1 border rounded text-right font-mono" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}