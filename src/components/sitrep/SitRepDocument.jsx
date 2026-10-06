import React from 'react';

export default function SitRepDocument({ sitrep, entries }) {
  const barangayData = entries['BARANGAY']?.data || {};
  const cswdData = entries['CSWD']?.data || {};
  const cgsdData = entries['CGSD']?.data || {};
  const cavdData = entries['CAVD']?.data || {};
  const bcwdData = entries['BCWD']?.data || {};
  const pagasaData = entries['PAGASA']?.data || {};

  const affectedPop = barangayData.affected_population || [];
  const damagedHouses = barangayData.damaged_houses || [];
  const insideEcs = cswdData.inside_ecs || [];
  const outsideEcs = cswdData.outside_ecs || [];
  const ageDist = cswdData.age_distribution || {};
  const sectorDist = cswdData.sector_breakdown || {};
  const floodedAreas = cavdData.flooded_areas || [];
  const roads = cgsdData.roads || [];
  const power = cgsdData.power || [];
  const water = bcwdData.water_interruptions || [];

  const totalAffectedFam = affectedPop.reduce((acc, r) => acc + (Number(r.families) || 0), 0);
  const totalAffectedPer = affectedPop.reduce((acc, r) => acc + (Number(r.persons) || 0), 0);

  const totalTotally = damagedHouses.reduce((acc, r) => acc + (Number(r.totally) || 0), 0);
  const totalPartially = damagedHouses.reduce((acc, r) => acc + (Number(r.partially) || 0), 0);

  const totalEcFamCum = insideEcs.reduce((acc, r) => acc + (Number(r.families_cum) || 0), 0);
  const totalEcFamNow = insideEcs.reduce((acc, r) => acc + (Number(r.families_now) || 0), 0);
  const totalEcPerCum = insideEcs.reduce((acc, r) => acc + (Number(r.persons_cum) || 0), 0);
  const totalEcPerNow = insideEcs.reduce((acc, r) => acc + (Number(r.persons_now) || 0), 0);

  return (
    <div className="bg-white text-slate-900 font-sans p-8 max-w-4xl mx-auto shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0">
      {/* Official Header with CDRRMD Logo */}
      <div className="text-center pb-6 border-b-2 border-slate-900 mb-6">
        <div className="flex items-center justify-center gap-5 mb-3">
          <img
            src="/cdrrmd-logo.jpg"
            alt="CDRRMD Butuan Logo"
            className="h-20 w-20 object-contain drop-shadow-sm print:h-16 print:w-16"
          />
          <div className="text-left">
            <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Republic of the Philippines • Caraga Region XIII
            </h2>
            <h1 className="text-base sm:text-lg font-black uppercase text-slate-900 leading-tight">
              City Disaster Risk Reduction and Management Department
            </h1>
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
              City Government of Butuan • Emergency Operations Center (EOC)
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200">
          <h2 className="text-xl font-black uppercase text-slate-900 tracking-tight">
            Situational Report #{sitrep?.report_number || '1'} on {sitrep?.incidents?.title || 'Disaster Incident'}
          </h2>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            as of {sitrep?.as_of_date || new Date().toISOString().split('T')[0]} at {sitrep?.as_of_time || '17:00 PST'}
          </p>
        </div>
      </div>

      {/* 1. Situation Overview */}
      <section className="mb-6">
        <h3 className="text-sm font-bold uppercase bg-slate-100 p-1.5 border-l-4 border-blue-600 text-slate-900 mb-2">
          I. Situation Overview
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed text-justify px-1">
          {sitrep?.situation_overview ||
            'At the reporting cutoff time, heavy to intense rainfall affected several low-lying and river-adjacent barangays across Butuan City. CDRRMD Operations Center continues monitoring situation parameters in coordination with BDRRMCs and frontline city departments.'}
        </p>
        {pagasaData.forecast && (
          <div className="mt-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
            <span className="font-bold text-slate-800">Meteorological Analysis ({pagasaData.bulletin_number || 'PAGASA Bulletin'}): </span>
            <span className="text-slate-700">{pagasaData.forecast}</span>
            <div className="mt-1 font-mono text-[11px] text-slate-600">
              24-Hour Rainfall: {pagasaData.rainfall_24h || 'N/A'} | Warning Signal: {pagasaData.signal_level || 'None'}
            </div>
          </div>
        )}
      </section>

      {/* 2. Status of Affected Population */}
      <section className="mb-6">
        <h3 className="text-sm font-bold uppercase bg-slate-100 p-1.5 border-l-4 border-blue-600 text-slate-900 mb-2">
          II. Status of Affected Areas and Population
        </h3>
        <p className="text-xs text-slate-700 mb-2 px-1">
          A total of <strong>{totalAffectedFam.toLocaleString()}</strong> families or <strong>{totalAffectedPer.toLocaleString()}</strong> persons are affected across <strong>{affectedPop.length}</strong> barangay(s).
        </p>
        <table className="w-full text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-50 text-slate-800">
              <th className="border border-slate-300 p-1.5 text-left">Barangay</th>
              <th className="border border-slate-300 p-1.5 text-right w-36">Affected Families</th>
              <th className="border border-slate-300 p-1.5 text-right w-36">Affected Persons</th>
            </tr>
          </thead>
          <tbody>
            {affectedPop.length === 0 ? (
              <tr>
                <td colSpan={3} className="border border-slate-300 p-2 text-center text-slate-400 italic">No recorded affected population.</td>
              </tr>
            ) : (
              affectedPop.map((r, i) => (
                <tr key={i}>
                  <td className="border border-slate-300 p-1.5">{r.barangay}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono">{Number(r.families).toLocaleString()}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono">{Number(r.persons).toLocaleString()}</td>
                </tr>
              ))
            )}
            <tr className="font-bold bg-slate-100">
              <td className="border border-slate-300 p-1.5 uppercase">Total</td>
              <td className="border border-slate-300 p-1.5 text-right font-mono">{totalAffectedFam.toLocaleString()}</td>
              <td className="border border-slate-300 p-1.5 text-right font-mono">{totalAffectedPer.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 3. Displaced Population Inside ECs */}
      <section className="mb-6">
        <h3 className="text-sm font-bold uppercase bg-slate-100 p-1.5 border-l-4 border-blue-600 text-slate-900 mb-2">
          III. Status of Displaced Population (Inside Evacuation Centers)
        </h3>
        <p className="text-xs text-slate-700 mb-2 px-1">
          A total of <strong>{totalEcFamNow.toLocaleString()}</strong> families (<strong>{totalEcPerNow.toLocaleString()}</strong> persons) are currently sheltering inside <strong>{insideEcs.length}</strong> designated evacuation centers.
        </p>
        <table className="w-full text-[11px] border-collapse border border-slate-300 mb-4">
          <thead>
            <tr className="bg-slate-50 text-slate-800">
              <th rowSpan={2} className="border border-slate-300 p-1">Evacuation Center</th>
              <th rowSpan={2} className="border border-slate-300 p-1">Location</th>
              <th colSpan={2} className="border border-slate-300 p-1 text-center">Families</th>
              <th colSpan={2} className="border border-slate-300 p-1 text-center">Persons</th>
              <th rowSpan={2} className="border border-slate-300 p-1">Origin</th>
              <th rowSpan={2} className="border border-slate-300 p-1">Remarks</th>
            </tr>
            <tr className="bg-slate-50 text-slate-800">
              <th className="border border-slate-300 p-1 text-right">Cum</th>
              <th className="border border-slate-300 p-1 text-right">Now</th>
              <th className="border border-slate-300 p-1 text-right">Cum</th>
              <th className="border border-slate-300 p-1 text-right">Now</th>
            </tr>
          </thead>
          <tbody>
            {insideEcs.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-slate-300 p-2 text-center text-slate-400 italic">No active evacuation centers.</td>
              </tr>
            ) : (
              insideEcs.map((ec, i) => (
                <tr key={i}>
                  <td className="border border-slate-300 p-1 font-medium">{ec.ec_name}</td>
                  <td className="border border-slate-300 p-1">{ec.location_barangay}</td>
                  <td className="border border-slate-300 p-1 text-right font-mono">{ec.families_cum}</td>
                  <td className="border border-slate-300 p-1 text-right font-mono">{ec.families_now}</td>
                  <td className="border border-slate-300 p-1 text-right font-mono">{ec.persons_cum}</td>
                  <td className="border border-slate-300 p-1 text-right font-mono">{ec.persons_now}</td>
                  <td className="border border-slate-300 p-1">{ec.origin_barangay}</td>
                  <td className="border border-slate-300 p-1">{ec.remarks || '-'}</td>
                </tr>
              ))
            )}
            <tr className="font-bold bg-slate-100">
              <td colSpan={2} className="border border-slate-300 p-1 uppercase">Total</td>
              <td className="border border-slate-300 p-1 text-right font-mono">{totalEcFamCum}</td>
              <td className="border border-slate-300 p-1 text-right font-mono">{totalEcFamNow}</td>
              <td className="border border-slate-300 p-1 text-right font-mono">{totalEcPerCum}</td>
              <td className="border border-slate-300 p-1 text-right font-mono">{totalEcPerNow}</td>
              <td colSpan={2} className="border border-slate-300 p-1"></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 4. Damaged Houses */}
      <section className="mb-6">
        <h3 className="text-sm font-bold uppercase bg-slate-100 p-1.5 border-l-4 border-blue-600 text-slate-900 mb-2">
          IV. Damaged Houses
        </h3>
        <p className="text-xs text-slate-700 mb-2 px-1">
          A total of <strong>{(totalTotally + totalPartially).toLocaleString()}</strong> houses were damaged (<strong>{totalTotally.toLocaleString()}</strong> totally, <strong>{totalPartially.toLocaleString()}</strong> partially).
        </p>
        <table className="w-full text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-50 text-slate-800">
              <th className="border border-slate-300 p-1.5 text-left">Location / Barangay</th>
              <th className="border border-slate-300 p-1.5 text-right w-32">Totally Damaged</th>
              <th className="border border-slate-300 p-1.5 text-right w-32">Partially Damaged</th>
              <th className="border border-slate-300 p-1.5 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {damagedHouses.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-slate-300 p-2 text-center text-slate-400 italic">No damaged houses reported.</td>
              </tr>
            ) : (
              damagedHouses.map((d, i) => (
                <tr key={i}>
                  <td className="border border-slate-300 p-1.5">{d.barangay}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono">{d.totally}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono">{d.partially}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                    {(Number(d.totally) || 0) + (Number(d.partially) || 0)}
                  </td>
                </tr>
              ))
            )}
            <tr className="font-bold bg-slate-100">
              <td className="border border-slate-300 p-1.5 uppercase">Total</td>
              <td className="border border-slate-300 p-1.5 text-right font-mono">{totalTotally}</td>
              <td className="border border-slate-300 p-1.5 text-right font-mono">{totalPartially}</td>
              <td className="border border-slate-300 p-1.5 text-right font-mono">{totalTotally + totalPartially}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 5. Lifeline Statuses */}
      <section className="mb-6">
        <h3 className="text-sm font-bold uppercase bg-slate-100 p-1.5 border-l-4 border-blue-600 text-slate-900 mb-2">
          V. Status of Lifelines
        </h3>

        {/* Roads & Bridges */}
        <h4 className="text-xs font-bold text-slate-800 mt-2 mb-1">Roads and Bridges:</h4>
        <table className="w-full text-xs border-collapse border border-slate-300 mb-3">
          <thead>
            <tr className="bg-slate-50 text-slate-800">
              <th className="border border-slate-300 p-1.5">Affected Road / Bridge</th>
              <th className="border border-slate-300 p-1.5">Description</th>
              <th className="border border-slate-300 p-1.5">Status</th>
              <th className="border border-slate-300 p-1.5">Actions Taken</th>
            </tr>
          </thead>
          <tbody>
            {roads.length === 0 ? (
              <tr><td colSpan={4} className="border border-slate-300 p-1.5 text-center text-slate-400 italic">All major roadways passable.</td></tr>
            ) : (
              roads.map((r, i) => (
                <tr key={i}>
                  <td className="border border-slate-300 p-1.5 font-medium">{r.affected_area}</td>
                  <td className="border border-slate-300 p-1.5">{r.description}</td>
                  <td className="border border-slate-300 p-1.5 font-bold text-red-700">{r.status}</td>
                  <td className="border border-slate-300 p-1.5">{r.actions_taken || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Power & Water Lifelines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-1">Power Lifeline:</h4>
            <table className="w-full text-[11px] border border-slate-300">
              <thead className="bg-slate-50">
                <tr>
                  <th className="border border-slate-300 p-1 text-left">Barangay</th>
                  <th className="border border-slate-300 p-1">Status / Remarks</th>
                </tr>
              </thead>
              <tbody>
                {power.length === 0 ? (
                  <tr><td colSpan={2} className="border border-slate-300 p-1.5 text-center text-slate-400 italic">Power normal.</td></tr>
                ) : (
                  power.map((p, i) => (
                    <tr key={i}>
                      <td className="border border-slate-300 p-1">{p.barangay}</td>
                      <td className="border border-slate-300 p-1">{p.remarks || (p.date_restored ? 'Restored' : 'Interrupted')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-1">Water Lifeline:</h4>
            <table className="w-full text-[11px] border border-slate-300">
              <thead className="bg-slate-50">
                <tr>
                  <th className="border border-slate-300 p-1 text-left">Barangay</th>
                  <th className="border border-slate-300 p-1">Status / Remarks</th>
                </tr>
              </thead>
              <tbody>
                {water.length === 0 ? (
                  <tr><td colSpan={2} className="border border-slate-300 p-1.5 text-center text-slate-400 italic">Water supply normal.</td></tr>
                ) : (
                  water.map((w, i) => (
                    <tr key={i}>
                      <td className="border border-slate-300 p-1">{w.barangay}</td>
                      <td className="border border-slate-300 p-1">{w.remarks || (w.date_restored ? 'Restored' : 'Interrupted')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. Signatures Block */}
      <div className="mt-12 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
        <div>
          <p className="font-semibold text-slate-600 mb-8">Prepared by:</p>
          <p className="font-bold uppercase text-slate-900 border-b border-slate-400 pb-1">
            {sitrep?.reviewed_by_name || 'CDRRMD OPERATIONS OFFICER'}
          </p>
          <p className="text-slate-500 mt-0.5">LDRRMO / EOC Duty Officer</p>
        </div>

        <div>
          <p className="font-semibold text-slate-600 mb-8">Approved by:</p>
          <p className="font-bold uppercase text-slate-900 border-b border-slate-400 pb-1">
            HON. RONNIE VICENTE C. LAGNADA
          </p>
          <p className="text-slate-500 mt-0.5">City Mayor / CDRRMC Chairperson</p>
        </div>
      </div>
    </div>
  );
}