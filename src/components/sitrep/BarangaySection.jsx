import React from "react";
import { BUTUAN_BARANGAYS } from "../../data/ButuanBarangays.js";

export default function BarangaySection({ data, onChange, disabled }) {
  const affected = data.affected_population || [];
  const damaged = data.damaged_houses || [];

  const handleAddAffected = () => {
    onChange({
      ...data,
      affected_population: [
        ...affected,
        { barangay: BUTUAN_BARANGAYS[0], families: 0, persons: 0 },
      ],
    });
  };

  const handleUpdateAffected = (idx, field, val) => {
    const next = [...affected];
    next[idx] = { ...next[idx], [field]: val };
    onChange({ ...data, affected_population: next });
  };

  const handleRemoveAffected = (idx) => {
    onChange({
      ...data,
      affected_population: affected.filter((_, i) => i !== idx),
    });
  };

  const handleAddDamaged = () => {
    onChange({
      ...data,
      damaged_houses: [
        ...damaged,
        { barangay: BUTUAN_BARANGAYS[0], totally: 0, partially: 0 },
      ],
    });
  };

  const handleUpdateDamaged = (idx, field, val) => {
    const next = [...damaged];
    next[idx] = { ...next[idx], [field]: val };
    onChange({ ...data, damaged_houses: next });
  };

  const handleRemoveDamaged = (idx) => {
    onChange({
      ...data,
      damaged_houses: damaged.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-8">
      {/* Affected Areas & Population */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">
              Status of Affected Areas & Population
            </h3>
            <p className="text-xs text-slate-500">
              Record affected families and individuals per barangay
            </p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleAddAffected}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
            >
              + Add Barangay
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-2.5">Barangay</th>
                <th className="p-2.5 w-36">Affected Families</th>
                <th className="p-2.5 w-36">Affected Persons</th>
                {!disabled && (
                  <th className="p-2.5 w-16 text-center">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {affected.length === 0 ? (
                <tr>
                  <td
                    colSpan={disabled ? 3 : 4}
                    className="p-4 text-center text-slate-400 italic"
                  >
                    No affected barangays recorded yet.
                  </td>
                </tr>
              ) : (
                affected.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-2">
                      <select
                        value={row.barangay}
                        disabled={disabled}
                        onChange={(e) =>
                          handleUpdateAffected(idx, "barangay", e.target.value)
                        }
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm bg-white"
                      >
                        {BUTUAN_BARANGAYS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={row.families}
                        disabled={disabled}
                        onChange={(e) =>
                          handleUpdateAffected(
                            idx,
                            "families",
                            Number(e.target.value),
                          )
                        }
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm text-right font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={row.persons}
                        disabled={disabled}
                        onChange={(e) =>
                          handleUpdateAffected(
                            idx,
                            "persons",
                            Number(e.target.value),
                          )
                        }
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm text-right font-mono"
                      />
                    </td>
                    {!disabled && (
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveAffected(idx)}
                          className="text-red-600 hover:text-red-800 text-sm font-semibold"
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

      {/* Damaged Houses */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">
              Damaged Houses
            </h3>
            <p className="text-xs text-slate-500">
              Tally totally and partially damaged houses
            </p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleAddDamaged}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
            >
              + Add Barangay
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-2.5">Barangay</th>
                <th className="p-2.5 w-32">Totally Damaged</th>
                <th className="p-2.5 w-32">Partially Damaged</th>
                <th className="p-2.5 w-28">Total</th>
                {!disabled && (
                  <th className="p-2.5 w-16 text-center">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {damaged.length === 0 ? (
                <tr>
                  <td
                    colSpan={disabled ? 4 : 5}
                    className="p-4 text-center text-slate-400 italic"
                  >
                    No damaged houses recorded.
                  </td>
                </tr>
              ) : (
                damaged.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-2">
                      <select
                        value={row.barangay}
                        disabled={disabled}
                        onChange={(e) =>
                          handleUpdateDamaged(idx, "barangay", e.target.value)
                        }
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm bg-white"
                      >
                        {BUTUAN_BARANGAYS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={row.totally}
                        disabled={disabled}
                        onChange={(e) =>
                          handleUpdateDamaged(
                            idx,
                            "totally",
                            Number(e.target.value),
                          )
                        }
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm text-right font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={row.partially}
                        disabled={disabled}
                        onChange={(e) =>
                          handleUpdateDamaged(
                            idx,
                            "partially",
                            Number(e.target.value),
                          )
                        }
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm text-right font-mono"
                      />
                    </td>
                    <td className="p-2 font-mono font-semibold text-slate-700 text-right">
                      {(Number(row.totally) || 0) +
                        (Number(row.partially) || 0)}
                    </td>
                    {!disabled && (
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveDamaged(idx)}
                          className="text-red-600 hover:text-red-800 text-sm font-semibold"
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
