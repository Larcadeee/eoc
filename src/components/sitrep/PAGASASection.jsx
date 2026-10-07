import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';

export default function PAGASASection({ sitrepId, userDepartment, isSupervisor }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('NOT_STARTED');
  const [bulletinNum, setBulletinNum] = useState('');
  const [signalLevel, setSignalLevel] = useState('None');
  const [rainfall24h, setRainfall24h] = useState('');
  const [forecast, setForecast] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  const canEdit = isSupervisor || userDepartment === 'PAGASA';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sitrep_department_entries')
          .select('*')
          .eq('sitrep_id', sitrepId)
          .eq('department', 'PAGASA')
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setStatus(data.status || 'NOT_STARTED');
          const entry = data.data || {};
          setBulletinNum(entry.bulletin_number || '');
          setSignalLevel(entry.signal_level || 'None');
          setRainfall24h(entry.rainfall_24h || '');
          setForecast(entry.forecast || '');
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
        department: 'PAGASA',
        status: newStatus,
        data: {
          bulletin_number: bulletinNum,
          signal_level: signalLevel,
          rainfall_24h: rainfall24h,
          forecast
        },
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

  if (loading) return <div className="p-6 text-center text-slate-400">Loading PAGASA data...</div>;

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg text-xs font-medium">
          You are viewing the <strong>PAGASA</strong> section in read-only mode.
        </div>
      )}

      {msg.text && (
        <div className={`p-3 rounded-lg text-xs font-medium border ${msg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h4 className="text-sm font-bold text-slate-900">PAGASA Synoptic & Weather Desk</h4>
          <p className="text-xs text-slate-500">Meteorological bulletins, rainfall readings, and warning signals</p>
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Bulletin #</label>
            <input type="text" placeholder="e.g. TC Tropical Cyclone Bulletin #4" disabled={!canEdit} value={bulletinNum} onChange={(e) => setBulletinNum(e.target.value)} className="w-full border rounded-lg p-2 text-xs" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Signal Level</label>
            <select disabled={!canEdit} value={signalLevel} onChange={(e) => setSignalLevel(e.target.value)} className="w-full border rounded-lg p-2 text-xs bg-white font-medium">
              <option value="None">None</option>
              <option value="Signal #1">Signal #1</option>
              <option value="Signal #2">Signal #2</option>
              <option value="Signal #3">Signal #3</option>
              <option value="Signal #4">Signal #4</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">24-Hour Rainfall Volume</label>
            <input type="text" placeholder="e.g. 145.2 mm (Intense)" disabled={!canEdit} value={rainfall24h} onChange={(e) => setRainfall24h(e.target.value)} className="w-full border rounded-lg p-2 text-xs" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Synoptic Weather Forecast & Meteorological Summary</label>
          <textarea rows={4} placeholder="PAGASA Doppler radar indicates continuous heavy rains over Agusan River basin..." disabled={!canEdit} value={forecast} onChange={(e) => setForecast(e.target.value)} className="w-full border rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>
    </div>
  );
}