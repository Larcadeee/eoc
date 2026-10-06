import React from 'react';
import { BUTUAN_BARANGAYS } from '../../data/ButuanBarangays';

export default function BCWDSection({ data, onChange, disabled }) {
  const interruptions = data.water_interruptions || [];

  const handleAdd = () => {
    onChange({
      ...data,
      water_interruptions: [
        ...interruptions,
        {
          barangay: BUTUAN_BARANGAYS[0],
          date_interrupted: '',
          date_restored: '',
          remarks: 'Turbidity issue at pumping station'
        }
      ]
    });
  };

  const handleUpdate = (idx, field, val) => {
    const next = [...interruptions];
    next[idx] = { ...next[idx], [field]: val };
    onChange({ ...data, water_interruptions: next });
  };

  const handleRemove = (idx) => {
    onChange({
      ...data,
      water_interruptions: interruptions.filter((_, i) => i !== idx)
    });
  };

  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">Water Lifeline Interruption & Restoration</h3>
          <p className="text-xs text-slate-500">Track water supply outages across service zones</p>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleAdd}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
          >
            + Add Water Outage
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
            <tr>
              <th className="p-2 w-48">Barangay</th>
              <th className="p-2">Date & Time Interrupted</th>
              <th className="p-2">Date & Time Restored</th>
              <th className="p-2">Remarks / Action Taken</th>
              {!disabled && <th className="p-2 w-12 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {interruptions.length === 0 ? (
              <tr>
                <td colSpan={disabled ? 4 : 5} className="p-4 text-center text-slate-400 italic">
                  Water systems operational with no interruptions reported.
                </td>
              </tr>
            ) : (
              interruptions.map((w, idx) => (
                <tr key={idx}>
                  <td className="p-1.5">
                    <select
                      value={w.barangay}
                      disabled={disabled}
                      onChange={(e) => handleUpdate(idx, 'barangay', e.target.value)}
                      className="w-full border rounded px-2 py-1 text-xs bg-white"
                    >
                      {BUTUAN_BARANGAYS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1.5">
                    <input
                      type="datetime-local"
                      value={w.date_interrupted}
                      disabled={disabled}
                      onChange={(e) => handleUpdate(idx, 'date_interrupted', e.target.value)}
                      className="w-full border rounded px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="datetime-local"
                      value={w.date_restored}
                      disabled={disabled}
                      onChange={(e) => handleUpdate(idx, 'date_restored', e.target.value)}
                      className="w-full border rounded px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={w.remarks}
                      disabled={disabled}
                      onChange={(e) => handleUpdate(idx, 'remarks', e.target.value)}
                      className="w-full border rounded px-2 py-1 text-xs"
                    />
                  </td>
                  {!disabled && (
                    <td className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        className="text-red-600 hover:text-red-800 text-xs font-bold"
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
  );
}