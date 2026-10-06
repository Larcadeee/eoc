import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function EncoderDashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  
  // Data State
  const [incidents, setIncidents] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Incident Form State
  const [title, setTitle] = useState('');
  const [incidentType, setIncidentType] = useState('FLOOD');
  const [severity, setSeverity] = useState('MODERATE');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Situation Report Form State
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [summary, setSummary] = useState('');
  const [affectedFamilies, setAffectedFamilies] = useState(0);
  const [affectedIndividuals, setAffectedIndividuals] = useState(0);
  const [activeEvacCenters, setActiveEvacCenters] = useState(0);
  const [submittingReport, setSubmittingReport] = useState(false);

  // Fetch active incidents & situation reports
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Incidents
      const { data: incidentData, error: incError } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (incError) throw incError;
      setIncidents(incidentData || []);

      if (incidentData && incidentData.length > 0 && !selectedIncidentId) {
        setSelectedIncidentId(incidentData[0].id);
      }

      // 2. Fetch Situation Reports (All active shared SitReps for collaborative intake)
      const { data: reportsData, error: repError } = await supabase
        .from('situation_reports')
        .select(`
          *,
          incidents (title, location)
        `)
        .order('created_at', { ascending: false });

      if (repError) throw repError;
      setMyReports(reportsData || []);
    } catch (err) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle New Incident Creation
  const handleCreateIncident = async (e) => {
    e.preventDefault();
    setStatusMsg({ text: '', type: '' });

    try {
      const { error } = await supabase.from('incidents').insert([
        {
          title,
          incident_type: incidentType,
          severity,
          location,
          description,
          created_by: user.id,
        },
      ]);

      if (error) throw error;

      setStatusMsg({ text: 'Disaster incident logged successfully.', type: 'success' });
      setTitle('');
      setLocation('');
      setDescription('');
      fetchData();
    } catch (err) {
      setStatusMsg({ text: err.message, type: 'error' });
    }
  };

  // Handle SitRep Creation (Draft or Submit)
  const handleCreateReport = async (initialStatus) => {
    if (!selectedIncidentId || !summary) {
      setStatusMsg({ text: 'Please select an incident and enter a situation summary.', type: 'error' });
      return;
    }

    setSubmittingReport(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const { data, error } = await supabase.from('situation_reports').insert([
        {
          incident_id: selectedIncidentId,
          summary,
          affected_families: Number(affectedFamilies),
          affected_individuals: Number(affectedIndividuals),
          evacuation_centers_active: Number(activeEvacCenters),
          status: initialStatus,
          workflow_status: initialStatus === 'SUBMITTED' ? 'FOR_REVIEW' : 'DRAFT',
          encoded_by: user.id,
        },
      ]).select();

      if (error) throw error;

      setStatusMsg({
        text: `Report successfully initialized as ${initialStatus}.`,
        type: 'success',
      });
      setSummary('');
      setAffectedFamilies(0);
      setAffectedIndividuals(0);
      setActiveEvacCenters(0);
      fetchData();

      // If created, optionally navigate straight into its collaborative workspace
      if (data && data[0]?.id) {
        navigate(`/sitrep/${data[0].id}`);
      }
    } catch (err) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center pb-5 border-b border-slate-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                ENCODER
              </span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded uppercase">
                {profile?.department || 'CDRRMD'}
              </span>
              <span className="text-xs text-slate-500 font-medium">CDRRMD EOC Field Intake</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Operations Data Desk</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Logged in as {profile?.full_name || profile?.email} ({profile?.department || 'Unassigned'})
            </p>
          </div>
          <button
            onClick={signOut}
            className="self-start sm:self-auto px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold rounded-lg text-slate-700 shadow-sm transition-colors"
          >
            Sign Out
          </button>
        </header>

        {statusMsg.text && (
          <div
            className={`p-3.5 rounded-lg text-xs font-medium border ${
              statusMsg.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Intake Forms */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Log Incident Card */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h2 className="text-base font-bold text-slate-900 mb-1">1. Register Disaster Event</h2>
              <p className="text-xs text-slate-500 mb-4">Initialize an active calamity incident record</p>

              <form onSubmit={handleCreateIncident} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flash Flood - Agusan River Overflow"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Type
                    </label>
                    <select
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none"
                    >
                      <option value="FLOOD">FLOOD</option>
                      <option value="TYPHOON">TYPHOON</option>
                      <option value="LANDSLIDE">LANDSLIDE</option>
                      <option value="EARTHQUAKE">EARTHQUAKE</option>
                      <option value="FIRE">FIRE</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Severity
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MODERATE">MODERATE</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Location / Barangay
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Brgy. Buhangin / Brgy. Baan Riverside"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    General Overview
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Initial observations and operational context..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-xs transition-colors"
                >
                  Create Incident
                </button>
              </form>
            </div>

            {/* 2. Encode SitRep Card */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h2 className="text-base font-bold text-slate-900 mb-1">2. Initialize Situation Report (SitRep)</h2>
              <p className="text-xs text-slate-500 mb-4">Start a shared SitRep master record</p>

              {incidents.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  Please register an incident first before generating SitReps.
                </p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Target Incident
                    </label>
                    <select
                      value={selectedIncidentId}
                      onChange={(e) => setSelectedIncidentId(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none"
                    >
                      {incidents.map((inc) => (
                        <option key={inc.id} value={inc.id}>
                          {inc.title} ({inc.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                        Families
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={affectedFamilies}
                        onChange={(e) => setAffectedFamilies(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                        Individuals
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={affectedIndividuals}
                        onChange={(e) => setAffectedIndividuals(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                        Evac Centers
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={activeEvacCenters}
                        onChange={(e) => setActiveEvacCenters(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Situation Summary & Operational Notes
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Summarize relief distribution, flood water levels, or road blockages..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={submittingReport}
                      onClick={() => handleCreateReport('DRAFT')}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      disabled={submittingReport}
                      onClick={() => handleCreateReport('SUBMITTED')}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm"
                    >
                      Submit for Review
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Situation Reports & Collaborative Workspace Links */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Active Situation Reports</h2>
                  <p className="text-xs text-slate-500">Access and encode department data into shared SitReps</p>
                </div>
                <button
                  onClick={fetchData}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-semibold"
                >
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Report #</th>
                      <th className="px-4 py-3">Incident / Summary</th>
                      <th className="px-4 py-3">Impact Stats</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Workspace</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                          Loading situation reports...
                        </td>
                      </tr>
                    ) : myReports.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                          No SitReps recorded yet.
                        </td>
                      </tr>
                    ) : (
                      myReports.map((rep) => (
                        <tr key={rep.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            #{rep.report_number}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">
                              {rep.incidents?.title || 'Unknown Event'}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">
                              {rep.summary}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-[11px]">
                              <span className="font-medium text-slate-900">{rep.affected_families}</span> fam /{' '}
                              <span className="font-medium text-slate-900">{rep.affected_individuals}</span> ind
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {rep.evacuation_centers_active} Active ECs
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                rep.status === 'PUBLISHED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : rep.status === 'APPROVED'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : rep.status === 'SUBMITTED'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {rep.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => navigate(`/sitrep/${rep.id}`)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold transition-colors shadow-sm inline-flex items-center gap-1"
                            >
                              <span>Open Workspace</span>
                              <span>&rarr;</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}