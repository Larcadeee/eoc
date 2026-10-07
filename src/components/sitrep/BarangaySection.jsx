// src/components/sitrep/BarangaySection.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { BUTUAN_BARANGAYS } from '../../data/ButuanBarangays';

export default function BarangaySection({ sitrepId, userDepartment, isSupervisor }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('NOT_STARTED');
  const [affectedPop, setAffectedPop] = useState([]);
  const [damagedHouses, setDamagedHouses] = useState([]);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const canEdit = isSupervisor || userDepartment === 'BARANGAY';

  useEffect(() => {
    async function loadBarangayData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sitrep_department_entries')
          .select('*')
          .eq('sitrep_id', sitrepId)
          .eq('department', 'BARANGAY')
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setStatus(data.status || 'NOT_STARTED');
          const entryData = data.data || {};
          setAffectedPop(Array.isArray(entryData.affected_population) ? entryData.affected_population : []);
          setDamagedHouses(Array.isArray(entryData.damaged_houses) ? entryData.damaged_houses : []);
        }
      } catch (err) {
        console.error('Error loading Barangay section:', err);
        setMsg({ text: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    if (sitrepId) {
      loadBarangayData();
    }
  }, [sitrepId]);

  const handleAddAffectedRow = () => {
    setAffectedPop([
      ...affectedPop,
      { barangay: BUTUAN_BARANGAYS[0] || '', families: 0, persons: 0 }
    ]);
  };

  const handleUpdateAffected = (idx, field, value) => {
    const copy = [...affectedPop];
    copy[idx][field] = value;
    if (field === 'families' && (!copy[idx].persons || copy[idx].persons === 0)) {
      copy[idx].persons = Number(value || 0) * 4;
    }
    setAffectedPop(copy);
  };

  const handleRemoveAffected = (idx) => {
    setAffectedPop(affectedPop.filter((_, i) => i !== idx));
  };

  const handleAddDamagedRow = () => {
    setDamagedHouses([
      ...damagedHouses,
      { barangay: BUTUAN_BARANGAYS[0] || '', totally: 0, partially: 0 }
    ]);
  };

  const handleUpdateDamaged = (idx, field, value) => {
    const copy = [...damagedHouses];
    copy[idx][field] = Number(value || 0);
    setDamagedHouses(copy);
  };

  const handleRemoveDamaged = (idx) => {
    setDamagedHouses(damagedHouses.filter((_, i) => i !== idx));
  };

  const handleSave = async (newStatus) => {
    setSaving(true);
    setMsg({ text: '', type: '' });
    try {
      const payload = {
        sitrep_id: sitrepId,
        department: 'BARANGAY',
        status: newStatus,
        data: {
          affected_population: affectedPop,
          damaged_houses: damagedHouses
        },
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('sitrep_department_entries')
        .upsert(payload, { onConflict: 'sitrep_id,department' });

      if (error) throw error;

      setStatus(newStatus);
      setMsg({
        text: newStatus === 'COMPLETED' ? 'Submitted to Supervisor successfully!' : 'Draft saved successfully.',
        type: 'success'
      });
    } catch (err) {
      setMsg({ text: `Failed to save: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-400">Loading Barangay intake data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Read-Only Warning Banner */}
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg text-xs font-medium">
          You are viewing the <strong>BARANGAY</strong> section in read-only mode. Only assigned Barangay encoders or supervisors can edit this section.
        </div>
      )}

      {msg.text && (
        <div
          className={`p-3 rounded-lg text-xs font-medium border ${
            msg.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Header & Status */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Barangay Clearance & Population Statistics</h4>
          <p className="text-xs text-slate-500">Record affected population and damaged infrastructure per barangay</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              status === 'COMPLETED'
                ? 'bg-emerald-100 text-emerald-800'
                : status === 'IN_PROGRESS'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {status.replace('_', ' ')}
          </span>
          {canEdit && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSave('IN_PROGRESS')}
                disabled={saving}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={() => handleSave('COMPLETED')}
                disabled={saving}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm"
              >
                Submit for Review
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 1. Affected Population Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            1. Affected Population per Barangay
          </h5>
          {canEdit && (
            <button
              type="button"
              onClick={handleAddAffectedRow}
              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold"
            >
              + Add Barangay
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-y border-slate-200">
              <tr>
                <th className="p-2">Barangay</th>
                <th className="p-2 w-32 text-right">Affected Families</th>
                <th className="p-2 w-32 text-right">Affected Persons</th>
                {canEdit && <th className="p-2 w-16 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {affectedPop.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                    No barangay population recorded yet.
                  </td>
                </tr>
              ) : (
                affectedPop.map((r, i) => (
                  <tr key={i}>
                    <td className="p-2">
                      {canEdit ? (
                        <select
                          value={r.barangay}
                          onChange={(e) => handleUpdateAffected(i, 'barangay', e.target.value)}
                          className="w-full border border-slate-300 rounded px-2 py-1 bg-white font-medium"
                        >
                          {BUTUAN_BARANGAYS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      ) : (
                        r.barangay
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {canEdit ? (
                        <input
                          type="number"
                          min="0"
                          value={r.families}
                          onChange={(e) => handleUpdateAffected(i, 'families', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-right font-mono"
                        />
                      ) : (
                        r.families
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {canEdit ? (
                        <input
                          type="number"
                          min="0"
                          value={r.persons}
                          onChange={(e) => handleUpdateAffected(i, 'persons', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-right font-mono"
                        />
                      ) : (
                        r.persons
                      )}
                    </td>
                    {canEdit && (
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveAffected(i)}
                          className="text-rose-600 font-bold px-1"
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Damaged Houses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            2. Damaged Houses per Barangay
          </h5>
          {canEdit && (
            <button
              type="button"
              onClick={handleAddDamagedRow}
              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold"
            >
              + Add Barangay
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-y border-slate-200">
              <tr>
                <th className="p-2">Barangay</th>
                <th className="p-2 w-32 text-right">Totally Damaged</th>
                <th className="p-2 w-32 text-right">Partially Damaged</th>
                <th className="p-2 w-28 text-right">Total</th>
                {canEdit && <th className="p-2 w-16 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {damagedHouses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                    No damaged houses recorded.
                  </td>
                </tr>
              ) : (
                damagedHouses.map((d, i) => (
                  <tr key={i}>
                    <td className="p-2">
                      {canEdit ? (
                        <select
                          value={d.barangay}
                          onChange={(e) => {
                            const copy = [...damagedHouses];
                            copy[i].barangay = e.target.value;
                            setDamagedHouses(copy);
                          }}
                          className="w-full border border-slate-300 rounded px-2 py-1 bg-white font-medium"
                        >
                          {BUTUAN_BARANGAYS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      ) : (
                        d.barangay
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {canEdit ? (
                        <input
                          type="number"
                          min="0"
                          value={d.totally}
                          onChange={(e) => handleUpdateDamaged(i, 'totally', e.target.value)}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-right font-mono"
                        />
                      ) : (
                        d.totally
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {canEdit ? (
                        <input
                          type="number"
                          min="0"
                          value={d.partially}
                          onChange={(e) => handleUpdateDamaged(i, 'partially', e.target.value)}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-right font-mono"
                        />
                      ) : (
                        d.partially
                      )}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-800">
                      {(Number(d.totally) || 0) + (Number(d.partially) || 0)}
                    </td>
                    {canEdit && (
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveDamaged(i)}
                          className="text-rose-600 font-bold px-1"
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}