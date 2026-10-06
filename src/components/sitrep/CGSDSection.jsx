import React from 'react';
import { BUTUAN_BARANGAYS } from '../../data/ButuanBarangays';

export default function CGSDSection({ data, onChange, disabled }) {
  const roads = data.roads || [];
  const power = data.power || [];
  const infraDamages = data.infra_damages || [];

  const handleAddRoad = () => {
    onChange({
      ...data,
      roads: [
        ...roads,
        {
          affected_area: '',
          description: '',
          actions_taken: '',
          status: 'NOT PASSABLE',
          remarks: ''
        }
      ]
    });
  };

  const handleUpdateRoad = (idx, field, val) => {
    const next = [...roads];
    next[idx] = { ...next[idx], [field]: val };
    onChange({ ...data, roads: next });
  };

  const handleRemoveRoad = (idx) => {
    onChange({ ...data, roads: roads.filter((_, i) => i !== idx) });
  };

  const handleAddPower = () => {
    onChange({
      ...data,
      power: [
        ...power,
        {
          barangay: BUTUAN_BARANGAYS[0],
          date_interrupted: '',
          date_restored: '',
          remarks: ''
        }
      ]
    });
  };

  const handleUpdatePower = (idx, field, val) => {
    const next = [...power];
    next[idx] = { ...next[idx], [field]: val };
    onChange({ ...data, power: next });
  };

  const handleRemovePower = (idx) => {
    onChange({ ...data, power: power.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-8">
      {/* Roads & Bridges */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Roads and Bridges</h3>
            <p className="text-xs text-slate-500">Infrastructure passability and clearing operations</p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleAddRoad}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
            >
              + Add Road / Bridge
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-2">Affected Area / Road</th>
                <th className="p-2">Description</th>
                <th className="p-2">Actions Taken</th>
                <th className="p-2 w-36">Status</th>
                <th className="p-2">Remarks</th>
                {!disabled && <th className="p-2 w-12 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roads.length === 0 ? (
                <tr>
                  <td colSpan={disabled ? 5 : 6} className="p-4 text-center text-slate-400 italic">
                    No road interruptions reported.
                  </td>
                </tr>
              ) : (
                roads.map((r, idx) => (
                  <tr key={idx}>
                    <td className="p-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Bancasi Highway"
                        value={r.affected_area}
                        disabled={disabled}
                        onChange={(e) => handleUpdateRoad(idx, 'affected_area', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Submerged in floodwater"
                        value={r.description}
                        disabled={disabled}
                        onChange={(e) => handleUpdateRoad(idx, 'description', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Barricades installed"
                        value={r.actions_taken}
                        disabled={disabled}
                        onChange={(e) => handleUpdateRoad(idx, 'actions_taken', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <select
                        value={r.status}
                        disabled={disabled}
                        onChange={(e) => handleUpdateRoad(idx, 'status', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs bg-white font-medium"
                      >
                        <option value="PASSABLE ALL VEHICLES">Passable to All</option>
                        <option value="PASSABLE HEAVY ONLY">Passable to Heavy Vehicles Only</option>
                        <option value="NOT PASSABLE">Not Passable</option>
                        <option value="ONE LANE PASSABLE">One Lane Passable</option>
                      </select>
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={r.remarks}
                        disabled={disabled}
                        onChange={(e) => handleUpdateRoad(idx, 'remarks', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    {!disabled && (
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRoad(idx)}
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

      {/* Power Lifeline */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Power Interruption & Restoration</h3>
            <p className="text-xs text-slate-500">Track electrical outage timelines per barangay</p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleAddPower}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
            >
              + Add Power Record
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-2">Barangay</th>
                <th className="p-2">Date/Time Interrupted</th>
                <th className="p-2">Date/Time Restored</th>
                <th className="p-2">Remarks</th>
                {!disabled && <th className="p-2 w-12 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {power.length === 0 ? (
                <tr>
                  <td colSpan={disabled ? 4 : 5} className="p-4 text-center text-slate-400 italic">
                    No power disruptions logged.
                  </td>
                </tr>
              ) : (
                power.map((p, idx) => (
                  <tr key={idx}>
                    <td className="p-1.5">
                      <select
                        value={p.barangay}
                        disabled={disabled}
                        onChange={(e) => handleUpdatePower(idx, 'barangay', e.target.value)}
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
                        value={p.date_interrupted}
                        disabled={disabled}
                        onChange={(e) => handleUpdatePower(idx, 'date_interrupted', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="datetime-local"
                        value={p.date_restored}
                        disabled={disabled}
                        onChange={(e) => handleUpdatePower(idx, 'date_restored', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Feeder line tripped"
                        value={p.remarks}
                        disabled={disabled}
                        onChange={(e) => handleUpdatePower(idx, 'remarks', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    {!disabled && (
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePower(idx)}
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