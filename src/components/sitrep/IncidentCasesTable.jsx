// src/components/sitrep/IncidentCasesTable.jsx
import React, { useState } from 'react';
import { BUTUAN_BARANGAYS } from '../../data/ButuanBarangays';
import { logTransaction } from '../../services/sitrepAuditService';

const CASE_TYPES = [
  'FLOODING',
  'FLASH_FLOOD',
  'LANDSLIDE',
  'PREEMPTIVE_EVAC',
  'STRUCTURAL_COLLAPSE',
  'WATER_SURGE',
  'ROAD_BLOCKAGE'
];

const EVAC_TYPES = [
  'INSIDE_EC',
  'OUTSIDE_EC (HOST_FAMILY)',
  'PREEMPTIVE',
  'FORCED_EVAC',
  'NONE'
];

const STATUS_OPTIONS = ['ACTIVE', 'MONITORING', 'RESOLVED/CLOSED'];

export default function IncidentCasesTable({
  cases,
  setCases,
  sitrepId,
  incidentId,
  currentVersion,
  user,
  profile,
  readOnly = false
}) {
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  // Form State
  const defaultFormData = {
    case_number: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    barangay: BUTUAN_BARANGAYS[0] || 'AGAO',
    purok: '',
    location_landmark: '',
    case_of: 'FLOODING',
    family: 0,
    individual: 0,
    idp: 0,
    evacuation_center: '',
    evac_type: 'INSIDE_EC',
    latitude: '',
    longitude: '',
    status: 'ACTIVE',
    remarks: '',
    validated_by: profile?.full_name || 'EOC Encoder'
  };

  const [formData, setFormData] = useState(defaultFormData);

  const openAddModal = () => {
    setEditIndex(null);
    setFormData({
      ...defaultFormData,
      case_number: `CASE-${Date.now().toString().slice(-4)}`,
      validated_by: profile?.full_name || profile?.email || 'EOC Encoder'
    });
    setShowModal(true);
  };

  const openEditModal = (idx) => {
    setEditIndex(idx);
    setFormData({ ...cases[idx] });
    setShowModal(true);
  };

  const handleFormChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    // Auto calculate individuals = families * 4 if individuals is 0
    if (field === 'family' && (!formData.individual || Number(formData.individual) === 0)) {
      updated.individual = Number(value || 0) * 4;
      updated.idp = Number(value || 0) * 4;
    }
    setFormData(updated);
  };

  const handleSaveModal = (e) => {
    e.preventDefault();

    if (editIndex !== null) {
      // Editing existing case
      const updatedList = [...cases];
      const prev = updatedList[editIndex];
      updatedList[editIndex] = formData;
      setCases(updatedList);

      logTransaction({
        sitrepId,
        incidentId,
        versionNumber: currentVersion,
        user,
        profile,
        action: 'UPDATED_CASE_ENTRY',
        fieldChanged: formData.case_number,
        previousValue: JSON.stringify(prev),
        newValue: JSON.stringify(formData)
      });
    } else {
      // Adding new case
      const updatedList = [...cases, formData];
      setCases(updatedList);

      logTransaction({
        sitrepId,
        incidentId,
        versionNumber: currentVersion,
        user,
        profile,
        action: 'ADDED_INCIDENT_CASE',
        fieldChanged: 'incident_cases',
        newValue: formData.case_number
      });
    }

    setShowModal(false);
  };

  const handleDeleteRow = (index) => {
    const target = cases[index];
    if (!window.confirm(`Delete case ${target.case_number}?`)) return;

    setCases(cases.filter((_, i) => i !== index));
    logTransaction({
      sitrepId,
      incidentId,
      versionNumber: currentVersion,
      user,
      profile,
      action: 'REMOVED_INCIDENT_CASE',
      fieldChanged: 'incident_cases',
      previousValue: target.case_number
    });
  };

  const totalFamilies = cases.reduce((sum, c) => sum + (Number(c.family) || 0), 0);
  const totalIndividuals = cases.reduce((sum, c) => sum + (Number(c.individual) || 0), 0);
  const totalIDPs = cases.reduce((sum, c) => sum + (Number(c.idp) || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Incident & Granular Case Intake Roster</h3>
          <p className="text-xs text-slate-500">
            Field-level incident case logging and displaced population accounting
          </p>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={openAddModal}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>+ Add Case Entry</span>
          </button>
        )}
      </div>

      {/* Summary KPI Badges */}
      <div className="px-4 flex gap-3 flex-wrap text-xs font-medium text-slate-600">
        <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Cases Recorded: <strong className="text-slate-900">{cases.length}</strong>
        </div>
        <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Total Families: <strong className="text-slate-900">{totalFamilies.toLocaleString()}</strong>
        </div>
        <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Total Individuals: <strong className="text-blue-700">{totalIndividuals.toLocaleString()}</strong>
        </div>
        <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Total IDPs: <strong className="text-purple-700">{totalIDPs.toLocaleString()}</strong>
        </div>
      </div>

      {/* Cases Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-y border-slate-200">
            <tr>
              <th className="p-3">Case ID</th>
              <th className="p-3">Barangay & Purok</th>
              <th className="p-3">Landmark</th>
              <th className="p-3">Type of Case</th>
              <th className="p-3 text-right">Families</th>
              <th className="p-3 text-right">Individuals</th>
              <th className="p-3">Evac Center & Type</th>
              <th className="p-3">Status</th>
              {!readOnly && <th className="p-3 text-right w-24">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {cases.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                  No incident cases added yet. Click "+ Add Case Entry" above to launch the case intake form.
                </td>
              </tr>
            ) : (
              cases.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900">{c.case_number}</td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-800">{c.barangay}</span>
                    {c.purok && <span className="text-slate-400 block text-[11px]">{c.purok}</span>}
                  </td>
                  <td className="p-3 text-slate-700">{c.location_landmark || '-'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                      {c.case_of}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-800">
                    {Number(c.family || 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-800">
                    {Number(c.individual || 0).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-slate-800">{c.evacuation_center || 'None'}</div>
                    <div className="text-[10px] text-slate-400">{c.evac_type}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  {!readOnly && (
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(idx)}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        className="text-rose-600 hover:text-rose-800 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* POP-UP FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editIndex !== null ? 'Edit Incident Case' : 'New Incident Case Entry'}
                </h3>
                <p className="text-xs text-slate-500">
                  Case ID: <span className="font-mono font-bold text-blue-600">{formData.case_number}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Location & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Affected Barangay *</label>
                  <select
                    value={formData.barangay}
                    onChange={(e) => handleFormChange('barangay', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {BUTUAN_BARANGAYS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Purok / Sitio</label>
                  <input
                    type="text"
                    placeholder="e.g. Purok 3A"
                    value={formData.purok}
                    onChange={(e) => handleFormChange('purok', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Landmark / Specific Loc</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Riverside Chapel"
                    value={formData.location_landmark}
                    onChange={(e) => handleFormChange('location_landmark', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Case Type & Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Case Of *</label>
                  <select
                    value={formData.case_of}
                    onChange={(e) => handleFormChange('case_of', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {CASE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Families</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.family}
                    onChange={(e) => handleFormChange('family', Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Individuals</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.individual}
                    onChange={(e) => handleFormChange('individual', Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Total IDPs</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.idp}
                    onChange={(e) => handleFormChange('idp', Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Evacuation Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Evacuation Center</label>
                  <input
                    type="text"
                    placeholder="e.g. Baan Riverside Covered Court / Chapel"
                    value={formData.evacuation_center}
                    onChange={(e) => handleFormChange('evacuation_center', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Evacuation Type</label>
                  <select
                    value={formData.evac_type}
                    onChange={(e) => handleFormChange('evac_type', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {EVAC_TYPES.map((et) => (
                      <option key={et} value={et}>{et}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Coordinates & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Latitude</label>
                  <input
                    type="text"
                    placeholder="8.9475"
                    value={formData.latitude}
                    onChange={(e) => handleFormChange('latitude', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Longitude</label>
                  <input
                    type="text"
                    placeholder="125.5406"
                    value={formData.longitude}
                    onChange={(e) => handleFormChange('longitude', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium outline-none"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Remarks & Field Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional observations, road conditions, relief distribution..."
                  value={formData.remarks}
                  onChange={(e) => handleFormChange('remarks', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  {editIndex !== null ? 'Save Changes' : 'Add Case Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}