import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';

export default function ViewerDashboard() {
  const { profile, signOut } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [publishedReports, setPublishedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncidentFilter, setSelectedIncidentFilter] = useState('ALL');

  const loadPublicData = async () => {
    setLoading(true);
    try {
      // 1. Fetch active monitored incidents
      const { data: incidentData, error: incError } = await supabase
        .from('incidents')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (incError) throw incError;
      setIncidents(incidentData || []);

      // 2. Fetch published situation reports
      // The database RLS policy enforces that only status = 'PUBLISHED' is returned for VIEWER roles
      const { data: repData, error: repError } = await supabase
        .from('situation_reports')
        .select(`
          *,
          incidents (title, location, severity, incident_type)
        `)
        .eq('status', 'PUBLISHED')
        .order('created_at', { ascending: false });

      if (repError) throw repError;
      setPublishedReports(repData || []);
    } catch (err) {
      console.error('Error fetching public sitboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublicData();
  }, []);

  const filteredReports = publishedReports.filter((r) => {
    if (selectedIncidentFilter === 'ALL') return true;
    return r.incident_id === selectedIncidentFilter;
  });

  // Calculate official statistics from published SitReps
  const totalFamilies = publishedReports.reduce(
    (acc, curr) => acc + (curr.affected_families || 0),
    0
  );
  const totalIndividuals = publishedReports.reduce(
    (acc, curr) => acc + (curr.affected_individuals || 0),
    0
  );
  const totalEvacCenters = publishedReports.reduce(
    (acc, curr) => acc + (curr.evacuation_centers_active || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8 text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Operational Status Bar */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center pb-5 border-b border-slate-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                OFFICIAL BULLETIN
              </span>
              <span className="text-xs text-slate-500 font-medium">
                CDRRMD EOC Public Situation Monitor
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">EOC Disaster Situation Board</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified operational data • Viewer Access: {profile?.full_name || profile?.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadPublicData}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg text-slate-700 transition-colors"
            >
              Sync Updates
            </button>
            <button
              onClick={signOut}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold rounded-lg text-slate-700 shadow-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Real-time Impact Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase text-slate-500">
              Active Monitored Hazards
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {incidents.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Verified ongoing events</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase text-slate-500">
              Total Affected Families
            </div>
            <div className="text-3xl font-extrabold text-blue-600 mt-1">
              {totalFamilies.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Verified by incident command</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase text-slate-500">
              Displaced Individuals
            </div>
            <div className="text-3xl font-extrabold text-indigo-600 mt-1">
              {totalIndividuals.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Requiring immediate relief</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase text-slate-500">
              Evacuation Facilities
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">
              {totalEvacCenters}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Operational shelters</div>
          </div>
        </div>

        {/* Active Incidents Overview Strip */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
            Active Calamity Alerts
          </h2>
          {incidents.length === 0 ? (
            <p className="text-xs text-slate-400">No active incidents at this time.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/70"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-slate-900">{inc.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        inc.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700'
                          : inc.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {inc.severity}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">📍 {inc.location}</div>
                  {inc.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{inc.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Published Situation Reports Feed */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Official Incident Bulletins (SitReps)
              </h2>
              <p className="text-xs text-slate-500">
                Declassified, supervisor-approved situation reports
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">
                Filter Event:
              </label>
              <select
                value={selectedIncidentFilter}
                onChange={(e) => setSelectedIncidentFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="ALL">All Events ({publishedReports.length})</option>
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    {inc.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Retrieving official bulletins...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No published situation reports match the current filter.
              </div>
            ) : (
              filteredReports.map((report) => (
                <div key={report.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                        SitRep #{report.report_number}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">
                        {report.incidents?.title}
                      </h3>
                      <span className="text-xs text-slate-400">• {report.incidents?.location}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Published: {new Date(report.updated_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/80 mb-3 whitespace-pre-wrap">
                    {report.summary}
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>
                        Affected Families: <strong>{report.affected_families}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span>
                        Displaced Persons: <strong>{report.affected_individuals}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>
                        Active Evacuation Shelters:{' '}
                        <strong>{report.evacuation_centers_active}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}