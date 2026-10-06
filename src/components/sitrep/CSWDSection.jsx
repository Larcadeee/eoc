import React from "react";
import { BUTUAN_BARANGAYS } from "../../data/ButuanBarangays";

const AGE_GROUPS = [
  "Infants (0-6 months old)",
  "Toddlers (7 months - 2 yrs old)",
  "Pre-schoolers (3-5 yrs old)",
  "School Age (6-12 yrs old)",
  "Teenagers (13-17 yrs old)",
  "Adults (18-59 yrs old)",
  "Senior Citizens (60 yrs old and above)",
];

const SECTORS = [
  "Pregnant",
  "Unaccompanied Minors",
  "Persons with Disabilities (PWDs)",
  "Solo Parents",
  "Indigenous Peoples (IPs)",
];

export default function CSWDSection({ data, onChange, disabled }) {
  const insideECs = data.inside_ecs || [];
  const outsideECs = data.outside_ecs || [];
  const ageDistribution = data.age_distribution || {};
  const sectorBreakdown = data.sector_breakdown || {};
  const assistance = data.assistance || { lgu: 0, ngos: 0, others: 0 };

  const handleAddEC = () => {
    onChange({
      ...data,
      inside_ecs: [
        ...insideECs,
        {
          ec_name: "",
          location_barangay: BUTUAN_BARANGAYS[0],
          families_cum: 0,
          families_now: 0,
          persons_cum: 0,
          persons_now: 0,
          origin_barangay: BUTUAN_BARANGAYS[0],
          remarks: "",
        },
      ],
    });
  };

  const handleUpdateEC = (idx, field, val) => {
    const next = [...insideECs];
    next[idx] = { ...next[idx], [field]: val };
    onChange({ ...data, inside_ecs: next });
  };

  const handleRemoveEC = (idx) => {
    onChange({ ...data, inside_ecs: insideECs.filter((_, i) => i !== idx) });
  };

  const handleAgeChange = (group, gender, val) => {
    onChange({
      ...data,
      age_distribution: {
        ...ageDistribution,
        [group]: {
          ...(ageDistribution[group] || { male: 0, female: 0 }),
          [gender]: Number(val) || 0,
        },
      },
    });
  };

  const handleSectorChange = (sector, gender, val) => {
    onChange({
      ...data,
      sector_breakdown: {
        ...sectorBreakdown,
        [sector]: {
          ...(sectorBreakdown[sector] || { male: 0, female: 0 }),
          [gender]: Number(val) || 0,
        },
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Inside ECs */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">
              Inside Evacuation Centers
            </h3>
            <p className="text-xs text-slate-500">
              Record open evacuation shelters and IDP counts
            </p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleAddEC}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
            >
              + Add Evacuation Center
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-2">Name of EC</th>
                <th className="p-2">EC Location</th>
                <th className="p-2 w-20">Fam (Cum)</th>
                <th className="p-2 w-20">Fam (Now)</th>
                <th className="p-2 w-20">Per (Cum)</th>
                <th className="p-2 w-20">Per (Now)</th>
                <th className="p-2">Origin Barangay</th>
                <th className="p-2">Remarks / Rooms</th>
                {!disabled && <th className="p-2 w-12 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {insideECs.length === 0 ? (
                <tr>
                  <td
                    colSpan={disabled ? 8 : 9}
                    className="p-4 text-center text-slate-400 italic"
                  >
                    No active evacuation centers recorded.
                  </td>
                </tr>
              ) : (
                insideECs.map((ec, idx) => (
                  <tr key={idx}>
                    <td className="p-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Butuan Central School"
                        value={ec.ec_name}
                        disabled={disabled}
                        onChange={(e) =>
                          handleUpdateEC(idx, "ec_name", e.target.value)
                        }
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <select
                        value={ec.location_barangay}
                        disabled={disabled}
                        onChange={(e) =>
                          handleUpdateEC(
                            idx,
                            "location_barangay",
                            e.target.value,
                          )
                        }
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                      >
                        {BUTUAN_BARANGAYS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        value={ec.families_cum}
                        disabled={disabled}
                        onChange={(e) =>
                          handleUpdateEC(
                            idx,
                            "families_cum",
                            Number(e.target.value),
                          )
                        }
                        className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs text-right font-mono"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        value={ec.families_now}
                        disabled={disabled}
                        onChange={(e) =>
                          handleUpdateEC(
                            idx,
                            "families_now",
                            Number(e.target.value),
                          )
                        }
                        className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs text-right font-mono"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        value={ec.persons_cum}
                        disabled={disabled}
                        onChange={(e) =>
                          handleUpdateEC(
                            idx,
                            "persons_cum",
                            Number(e.target.value),
                          )
                        }
                        className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs text-right font-mono"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        value={ec.persons_now}
                        disabled={disabled}
                        onChange={(e) =>
                          handleUpdateEC(
                            idx,
                            "persons_now",
                            Number(e.target.value),
                          )
                        }
                        className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs text-right font-mono"
                      />
                    </td>
                    <td className="p-1.5">
                      <select
                        value={ec.origin_barangay}
                        disabled={disabled}
                        onChange={(e) =>
                          handleUpdateEC(idx, "origin_barangay", e.target.value)
                        }
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                      >
                        {BUTUAN_BARANGAYS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        placeholder="Classrooms used"
                        value={ec.remarks}
                        disabled={disabled}
                        onChange={(e) =>
                          handleUpdateEC(idx, "remarks", e.target.value)
                        }
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                      />
                    </td>
                    {!disabled && (
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveEC(idx)}
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

      {/* Demographics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Age Groups */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <h4 className="font-semibold text-slate-800 mb-2">
            Age Distribution (Inside ECs)
          </h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="p-2 text-left">Age Range</th>
                <th className="p-2 w-24 text-center">Male</th>
                <th className="p-2 w-24 text-center">Female</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {AGE_GROUPS.map((grp) => (
                <tr key={grp}>
                  <td className="p-2 text-slate-700">{grp}</td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      min="0"
                      disabled={disabled}
                      value={ageDistribution[grp]?.male || 0}
                      onChange={(e) =>
                        handleAgeChange(grp, "male", e.target.value)
                      }
                      className="w-full border rounded px-2 py-1 text-center font-mono"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      min="0"
                      disabled={disabled}
                      value={ageDistribution[grp]?.female || 0}
                      onChange={(e) =>
                        handleAgeChange(grp, "female", e.target.value)
                      }
                      className="w-full border rounded px-2 py-1 text-center font-mono"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vulnerable Sectors */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <h4 className="font-semibold text-slate-800 mb-2">
            Vulnerable Sectors (Inside ECs)
          </h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="p-2 text-left">Sector</th>
                <th className="p-2 w-24 text-center">Male</th>
                <th className="p-2 w-24 text-center">Female</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SECTORS.map((sec) => (
                <tr key={sec}>
                  <td className="p-2 text-slate-700">{sec}</td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      min="0"
                      disabled={disabled}
                      value={sectorBreakdown[sec]?.male || 0}
                      onChange={(e) =>
                        handleSectorChange(sec, "male", e.target.value)
                      }
                      className="w-full border rounded px-2 py-1 text-center font-mono"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      min="0"
                      disabled={disabled}
                      value={sectorBreakdown[sec]?.female || 0}
                      onChange={(e) =>
                        handleSectorChange(sec, "female", e.target.value)
                      }
                      className="w-full border rounded px-2 py-1 text-center font-mono"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
