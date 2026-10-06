import React from 'react';
import { BUTUAN_BARANGAYS } from '../../data/ButuanBarangays';

export default function CAVDSection({ data, onChange, disabled }) {
  const flooded = data.flooded_areas || [];
  const agriculture = data.agriculture || [];

  const handleAddFlood = () => {
    onChange({
      ...data,
      flooded_areas: [
        ...flooded,
        { barangay: BUTUAN_BARANGAYS[0], specific_areas: '', situation: 'Knee-deep floodwaters' }
      ]
    });
  };

  const handleUpdateFlood = (idx, field, val) => {
    const next = [...flooded];
    next[idx] = { ...next[idx], [field]: val };
    onChange({ ...data, flooded_areas: next });
  };

  const handleRemoveFlood = (idx) => {
    onChange({ ...data, flooded_areas: flooded.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Flooded & Landslide Areas</h3>
            <p className="text-xs text-slate-500">Monitor ground situations and submerged locations</p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleAddFlood}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
            >
              + Add Incident Area
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-2 w-48">Barangay</th>
                <th className="p-2">Specific Sitios / Areas</th>
                <th className="p-2">Situation / Water Level</th>
                {!disabled && <th className="p-2 w-12 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flooded.length === 0 ? (
                <tr>
                  <td colSpan={disabled ? 3 : 4} className="p-4 text-center text-slate-400 italic">
                    No flooded or landslide areas reported.
                  </td>
                </tr>
              ) : (
                flooded.map((f, idx) => (
                  <tr key={idx}>
                    <td className="p-1.5">
                      <select
                        value={f.barangay}
                        disabled={disabled}
                        onChange={(e) => handleUpdateFlood(idx, 'barangay', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs bg-white"
                      >
                        {BUTUAN_BARANGAYS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Purok 3 & 4 along riverbank"
                        value={f.specific_areas}
                        disabled={disabled}
                        onChange={(e) => handleUpdateFlood(idx, 'specific_areas', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Waist-deep, receding slowly"
                        value={f.situation}
                        disabled={disabled}
                        onChange={(e) => handleUpdateFlood(idx, 'situation', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    {!disabled && (
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFlood(idx)}
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
    </div>
  );
}