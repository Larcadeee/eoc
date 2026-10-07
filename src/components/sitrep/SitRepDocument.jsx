// src/components/sitrep/SitRepDocument.jsx
import React, { useState } from 'react';

export default function SitRepDocument({ sitrep, entries = {}, currentUser }) {
  // Allow CDRRMD / CSWD personnel to input their name, defaulting to current user
  const [preparedByName, setPreparedByName] = useState(
    currentUser?.full_name || currentUser?.email?.split('@')[0] || ''
  );

  const incident = sitrep?.incidents || {};
  const barangayData = entries?.BARANGAY?.data || {};
  const cswdData = entries?.CSWD?.data || {};
  const cgsdData = entries?.CGSD?.data || {};
  const cavdData = entries?.CAVD?.data || {};
  const bcwdData = entries?.BCWD?.data || {};

  // Formatted Date & Time strings
  const reportDate = new Date(sitrep?.updated_at || Date.now());
  const formattedDate = reportDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = reportDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // 1. Affected Population Data
  const affectedPop = Array.isArray(barangayData.affected_population)
    ? barangayData.affected_population
    : [];
  const totalAffectedFamilies = affectedPop.reduce(
    (sum, r) => sum + (Number(r.families) || 0),
    0
  );
  const totalAffectedPersons = affectedPop.reduce(
    (sum, r) => sum + (Number(r.persons) || 0),
    0
  );

  // 2. Displaced Population - Inside EC
  const insideEcs = Array.isArray(cswdData.inside_ecs) ? cswdData.inside_ecs : [];
  const totalEcFamCum = insideEcs.reduce((s, r) => s + (Number(r.families_cum) || 0), 0);
  const totalEcFamNow = insideEcs.reduce((s, r) => s + (Number(r.families_now) || 0), 0);
  const totalEcPerCum = insideEcs.reduce((s, r) => s + (Number(r.persons_cum) || 0), 0);
  const totalEcPerNow = insideEcs.reduce((s, r) => s + (Number(r.persons_now) || 0), 0);

  // 3. Displaced Population - Outside EC
  const outsideEcs = Array.isArray(cswdData.outside_ecs) ? cswdData.outside_ecs : [];
  const totalOutFamCum = outsideEcs.reduce((s, r) => s + (Number(r.families_cum) || 0), 0);
  const totalOutFamNow = outsideEcs.reduce((s, r) => s + (Number(r.families_now) || 0), 0);
  const totalOutPerCum = outsideEcs.reduce((s, r) => s + (Number(r.persons_cum) || 0), 0);
  const totalOutPerNow = outsideEcs.reduce((s, r) => s + (Number(r.persons_now) || 0), 0);

  const grandDisplacedFam = totalEcFamNow + totalOutFamNow;
  const grandDisplacedPer = totalEcPerNow + totalOutPerNow;

  // 4. Age Distribution
  const age = cswdData.age_distribution || {};
  const ageRows = [
    { label: 'Infants (0-6 months old)', m: age.infants_m || 0, f: age.infants_f || 0 },
    { label: 'Toddlers (7 months old- 2 yrs old)', m: age.toddlers_m || 0, f: age.toddlers_f || 0 },
    { label: 'Pre-schoolers (3- 5 yrs old)', m: age.preschoolers_m || 0, f: age.preschoolers_f || 0 },
    { label: 'School Age (6-12 yrs old)', m: age.children_m || 0, f: age.children_f || 0 },
    { label: 'Teenagers (13-17 yrs old)', m: age.teenagers_m || 0, f: age.teenagers_f || 0 },
    { label: 'Adults (18-59 yrs old)', m: age.adults_m || 0, f: age.adults_f || 0 },
    { label: 'Senior Citizens (60 yrs old and above)', m: age.seniors_m || 0, f: age.seniors_f || 0 }
  ];
  const totalAgeM = ageRows.reduce((s, r) => s + Number(r.m), 0);
  const totalAgeF = ageRows.reduce((s, r) => s + Number(r.f), 0);

  // 5. Sector Breakdown
  const sec = cswdData.sector_breakdown || {};
  const sectorRows = [
    { label: 'Pregnant', m: 0, f: sec.pregnant || 0 },
    { label: 'Unaccompanied Minors', m: sec.unaccompanied_m || 0, f: sec.unaccompanied_f || 0 },
    { label: 'Persons with Disabilities (PWDs)', m: sec.pwds_m || 0, f: sec.pwds_f || 0 },
    { label: 'Solo Parents', m: sec.solo_m || 0, f: sec.solo_f || 0 },
    { label: 'Indigenous Peoples (IPs)', m: sec.indigenous_m || 0, f: sec.indigenous_f || 0 }
  ];
  const totalSecM = sectorRows.reduce((s, r) => s + Number(r.m), 0);
  const totalSecF = sectorRows.reduce((s, r) => s + Number(r.f), 0);

  // 6. Damaged Houses
  const damagedHouses = Array.isArray(barangayData.damaged_houses)
    ? barangayData.damaged_houses
    : [];
  const totalTotally = damagedHouses.reduce((s, r) => s + (Number(r.totally) || 0), 0);
  const totalPartially = damagedHouses.reduce((s, r) => s + (Number(r.partially) || 0), 0);
  const grandTotalDamaged = totalTotally + totalPartially;

  // 7. Flooded / Landslide Areas & Infrastructure Damages
  const floodedAreas = Array.isArray(cavdData.flooded_areas) ? cavdData.flooded_areas : [];
  const roads = Array.isArray(cgsdData.roads) ? cgsdData.roads : [];
  const power = Array.isArray(cgsdData.power) ? cgsdData.power : [];
  const waterOutages = Array.isArray(bcwdData.water_interruptions)
    ? bcwdData.water_interruptions
    : [];

  return (
    <div className="bg-white p-10 max-w-5xl mx-auto shadow-sm border border-slate-300 print:border-none print:shadow-none print:p-0 text-black font-sans text-xs leading-normal">
      
      {/* HEADER SECTION (EXACT DROMIC TITLE TEMPLATE) */}
      <div className="mb-6">
        <h1 className="text-base font-bold text-black uppercase tracking-tight">
          LGU DROMIC/Situational Report #{sitrep?.report_number || '1'} on the {incident.title || '[Incident Name]'}
        </h1>
        <div className="text-xs font-semibold text-black">
          Butuan City, Agusan del Norte
        </div>
        <div className="text-xs italic text-black mt-0.5">
          as of {formattedDate}, {formattedTime}
        </div>
      </div>

      {/* 1. SITUATION OVERVIEW */}
      <div className="mb-6 space-y-1">
        <h2 className="text-sm font-bold text-black">Situation Overview</h2>
        <p className="text-xs text-justify text-black leading-relaxed whitespace-pre-line">
          {sitrep?.summary ||
            'Please narrate the current situation of the city/municipality relative to the disaster incident.'}
        </p>
      </div>

      {/* 2. STATUS OF AFFECTED AREAS AND POPULATION */}
      <div className="mb-6 space-y-2">
        <h2 className="text-sm font-bold text-black">Status of Affected Areas and Population</h2>
        <p className="text-xs text-black">
          A total of <strong>{totalAffectedFamilies.toLocaleString()}</strong> families or{' '}
          <strong>{totalAffectedPersons.toLocaleString()}</strong> persons are/have been/were affected in{' '}
          <strong>{affectedPop.length}</strong> barangays.
        </p>
        <table className="w-full text-xs text-left border border-black border-collapse">
          <thead>
            <tr className="border-b border-black bg-slate-100 font-bold">
              <th rowSpan={2} className="p-2 border-r border-black align-middle">
                Barangays
              </th>
              <th colSpan={2} className="p-1 border-b border-black text-center">
                Number of Affected
              </th>
            </tr>
            <tr className="border-b border-black bg-slate-100 font-bold">
              <th className="p-1.5 border-r border-black text-right w-32">Families</th>
              <th className="p-1.5 text-right w-32">Persons</th>
            </tr>
          </thead>
          <tbody>
            {affectedPop.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-2 text-center italic text-slate-500">
                  No affected population records entered.
                </td>
              </tr>
            ) : (
              affectedPop.map((r, i) => (
                <tr key={i} className="border-b border-black">
                  <td className="p-1.5 border-r border-black">{r.barangay}</td>
                  <td className="p-1.5 border-r border-black text-right font-mono">
                    {Number(r.families || 0).toLocaleString()}
                  </td>
                  <td className="p-1.5 text-right font-mono">
                    {Number(r.persons || 0).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
            <tr className="font-bold bg-slate-50 border-t-2 border-black">
              <td className="p-2 border-r border-black uppercase">TOTAL</td>
              <td className="p-2 border-r border-black text-right font-mono">
                {totalAffectedFamilies.toLocaleString()}
              </td>
              <td className="p-2 text-right font-mono">
                {totalAffectedPersons.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. STATUS OF DISPLACED POPULATION */}
      <div className="mb-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-black">Status of Displaced Population</h2>
          <p className="text-xs text-black mt-1">
            A total of <strong>{grandDisplacedFam.toLocaleString()}</strong> families or{' '}
            <strong>{grandDisplacedPer.toLocaleString()}</strong> persons are displaced inside and outside ECs, below is the breakdown:
          </p>
        </div>

        {/* 3.1 INSIDE EVACUATION CENTER */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-black uppercase">Inside Evacuation Center</h3>
          <p className="text-xs text-black">
            A total of <strong>{totalEcFamNow.toLocaleString()}</strong> families or{' '}
            <strong>{totalEcPerNow.toLocaleString()}</strong> persons have evacuated in{' '}
            <strong>{insideEcs.length}</strong> evacuation centers, to wit:
          </p>
          <table className="w-full text-xs text-left border border-black border-collapse">
            <thead>
              <tr className="border-b border-black bg-slate-100 font-bold text-center">
                <th rowSpan={2} className="p-2 border-r border-black align-middle text-left">
                  Name of Evacuation Center
                </th>
                <th rowSpan={2} className="p-2 border-r border-black align-middle text-left">
                  Location / Barangay
                </th>
                <th colSpan={2} className="p-1 border-b border-black border-r">Families</th>
                <th colSpan={2} className="p-1 border-b border-black border-r">Persons</th>
                <th rowSpan={2} className="p-2 border-r border-black align-middle text-left">
                  Origin / Barangay
                </th>
                <th rowSpan={2} className="p-2 align-middle text-left">
                  Remarks* (No. of classrooms used)
                </th>
              </tr>
              <tr className="border-b border-black bg-slate-100 font-bold text-center">
                <th className="p-1 border-r border-black w-14">Cum</th>
                <th className="p-1 border-r border-black w-14">Now</th>
                <th className="p-1 border-r border-black w-14">Cum</th>
                <th className="p-1 border-r border-black w-14">Now</th>
              </tr>
            </thead>
            <tbody>
              {insideEcs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-2 text-center italic text-slate-500">
                    No active evacuation centers reported.
                  </td>
                </tr>
              ) : (
                insideEcs.map((ec, i) => (
                  <tr key={i} className="border-b border-black">
                    <td className="p-1.5 border-r border-black">{ec.ec_name || '-'}</td>
                    <td className="p-1.5 border-r border-black">{ec.location_barangay || '-'}</td>
                    <td className="p-1.5 border-r border-black text-right font-mono">{Number(ec.families_cum || 0).toLocaleString()}</td>
                    <td className="p-1.5 border-r border-black text-right font-mono">{Number(ec.families_now || 0).toLocaleString()}</td>
                    <td className="p-1.5 border-r border-black text-right font-mono">{Number(ec.persons_cum || 0).toLocaleString()}</td>
                    <td className="p-1.5 border-r border-black text-right font-mono">{Number(ec.persons_now || 0).toLocaleString()}</td>
                    <td className="p-1.5 border-r border-black">{ec.origin_barangay || '-'}</td>
                    <td className="p-1.5">{ec.remarks || '-'}</td>
                  </tr>
                ))
              )}
              <tr className="font-bold bg-slate-50 border-t-2 border-black">
                <td colSpan={2} className="p-2 border-r border-black uppercase">TOTAL</td>
                <td className="p-2 border-r border-black text-right font-mono">{totalEcFamCum.toLocaleString()}</td>
                <td className="p-2 border-r border-black text-right font-mono">{totalEcFamNow.toLocaleString()}</td>
                <td className="p-2 border-r border-black text-right font-mono">{totalEcPerCum.toLocaleString()}</td>
                <td className="p-2 border-r border-black text-right font-mono">{totalEcPerNow.toLocaleString()}</td>
                <td colSpan={2} className="p-2"></td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] italic text-slate-600">*Only for Schools used as ECs</p>
        </div>

        {/* 3.2 AGE DISTRIBUTION & SECTOR TABLES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Age Distribution Table */}
          <div className="space-y-1">
            <p className="text-xs text-black">
              Following is the breakdown of the individuals inside evacuation centers according to age distribution:
            </p>
            <table className="w-full text-xs text-left border border-black border-collapse">
              <thead>
                <tr className="border-b border-black bg-slate-100 font-bold">
                  <th className="p-1.5 border-r border-black">Age Range/Distribution</th>
                  <th className="p-1.5 border-r border-black text-right w-16">Male</th>
                  <th className="p-1.5 text-right w-16">Female</th>
                </tr>
              </thead>
              <tbody>
                {ageRows.map((r, idx) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="p-1 border-r border-black">{r.label}</td>
                    <td className="p-1 border-r border-black text-right font-mono">{Number(r.m).toLocaleString()}</td>
                    <td className="p-1 text-right font-mono">{Number(r.f).toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-slate-50 border-t-2 border-black">
                  <td className="p-1.5 border-r border-black uppercase">TOTAL</td>
                  <td className="p-1.5 border-r border-black text-right font-mono">{totalAgeM.toLocaleString()}</td>
                  <td className="p-1.5 text-right font-mono">{totalAgeF.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sector Table */}
          <div className="space-y-1">
            <p className="text-xs text-black">
              Further, below is the breakdown of individuals inside ECs according to their sector:
            </p>
            <table className="w-full text-xs text-left border border-black border-collapse">
              <thead>
                <tr className="border-b border-black bg-slate-100 font-bold">
                  <th className="p-1.5 border-r border-black">Sector</th>
                  <th className="p-1.5 border-r border-black text-right w-16">Male</th>
                  <th className="p-1.5 text-right w-16">Female</th>
                </tr>
              </thead>
              <tbody>
                {sectorRows.map((r, idx) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="p-1 border-r border-black">{r.label}</td>
                    <td className="p-1 border-r border-black text-right font-mono">{Number(r.m).toLocaleString()}</td>
                    <td className="p-1 text-right font-mono">{Number(r.f).toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-slate-50 border-t-2 border-black">
                  <td className="p-1.5 border-r border-black uppercase">TOTAL</td>
                  <td className="p-1.5 border-r border-black text-right font-mono">{totalSecM.toLocaleString()}</td>
                  <td className="p-1.5 text-right font-mono">{totalSecF.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3.3 OUTSIDE EVACUATION CENTER */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-black uppercase">Outside Evacuation Center</h3>
          <p className="text-xs text-black">
            There are <strong>{totalOutFamNow.toLocaleString()}</strong> families or{' '}
            <strong>{totalOutPerNow.toLocaleString()}</strong> persons temporarily staying with their relatives and/or friends' houses, to wit:
          </p>
          <table className="w-full text-xs text-left border border-black border-collapse">
            <thead>
              <tr className="border-b border-black bg-slate-100 font-bold text-center">
                <th rowSpan={2} className="p-2 border-r border-black align-middle text-left">
                  Barangay / Host Residence
                </th>
                <th colSpan={2} className="p-1 border-b border-black border-r">Families</th>
                <th colSpan={2} className="p-1 border-b border-black border-r">Persons</th>
                <th rowSpan={2} className="p-2 align-middle text-left">
                  Origin of IDPS / Barangay
                </th>
              </tr>
              <tr className="border-b border-black bg-slate-100 font-bold text-center">
                <th className="p-1 border-r border-black w-20">Cum</th>
                <th className="p-1 border-r border-black w-20">Now</th>
                <th className="p-1 border-r border-black w-20">Cum</th>
                <th className="p-1 border-r border-black w-20">Now</th>
              </tr>
            </thead>
            <tbody>
              {outsideEcs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-2 text-center italic text-slate-500">
                    No outside EC displacements reported.
                  </td>
                </tr>
              ) : (
                outsideEcs.map((o, idx) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="p-1.5 border-r border-black">{o.host_residence || '-'}</td>
                    <td className="p-1.5 border-r border-black text-right font-mono">{Number(o.families_cum || 0).toLocaleString()}</td>
                    <td className="p-1.5 border-r border-black text-right font-mono">{Number(o.families_now || 0).toLocaleString()}</td>
                    <td className="p-1.5 border-r border-black text-right font-mono">{Number(o.persons_cum || 0).toLocaleString()}</td>
                    <td className="p-1.5 border-r border-black text-right font-mono">{Number(o.persons_now || 0).toLocaleString()}</td>
                    <td className="p-1.5">{o.origin_barangay || '-'}</td>
                  </tr>
                ))
              )}
              <tr className="font-bold bg-slate-50 border-t-2 border-black">
                <td className="p-2 border-r border-black uppercase">TOTAL</td>
                <td className="p-2 border-r border-black text-right font-mono">{totalOutFamCum.toLocaleString()}</td>
                <td className="p-2 border-r border-black text-right font-mono">{totalOutFamNow.toLocaleString()}</td>
                <td className="p-2 border-r border-black text-right font-mono">{totalOutPerCum.toLocaleString()}</td>
                <td className="p-2 border-r border-black text-right font-mono">{totalOutPerNow.toLocaleString()}</td>
                <td className="p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. DAMAGED HOUSES */}
      <div className="mb-6 space-y-2">
        <h2 className="text-sm font-bold text-black">Damaged Houses</h2>
        <p className="text-xs text-black">
          A total of <strong>{grandTotalDamaged.toLocaleString()}</strong> houses were damaged; of which,{' '}
          <strong>{totalTotally.toLocaleString()}</strong> are totally damaged and{' '}
          <strong>{totalPartially.toLocaleString()}</strong> are partially damaged.
        </p>
        <table className="w-full text-xs text-left border border-black border-collapse">
          <thead>
            <tr className="border-b border-black bg-slate-100 font-bold">
              <th rowSpan={2} className="p-2 border-r border-black align-middle">
                Location / Barangay
              </th>
              <th colSpan={3} className="p-1 border-b border-black text-center">
                No. of Damaged Houses
              </th>
            </tr>
            <tr className="border-b border-black bg-slate-100 font-bold text-right">
              <th className="p-1.5 border-r border-black w-28">Totally</th>
              <th className="p-1.5 border-r border-black w-28">Partially</th>
              <th className="p-1.5 w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {damagedHouses.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-2 text-center italic text-slate-500">
                  No damaged houses reported.
                </td>
              </tr>
            ) : (
              damagedHouses.map((d, i) => (
                <tr key={i} className="border-b border-black">
                  <td className="p-1.5 border-r border-black">{d.barangay}</td>
                  <td className="p-1.5 border-r border-black text-right font-mono">
                    {Number(d.totally || 0).toLocaleString()}
                  </td>
                  <td className="p-1.5 border-r border-black text-right font-mono">
                    {Number(d.partially || 0).toLocaleString()}
                  </td>
                  <td className="p-1.5 text-right font-mono font-bold">
                    {(Number(d.totally || 0) + Number(d.partially || 0)).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
            <tr className="font-bold bg-slate-50 border-t-2 border-black">
              <td className="p-2 border-r border-black uppercase">TOTAL</td>
              <td className="p-2 border-r border-black text-right font-mono">
                {totalTotally.toLocaleString()}
              </td>
              <td className="p-2 border-r border-black text-right font-mono">
                {totalPartially.toLocaleString()}
              </td>
              <td className="p-2 text-right font-mono">
                {grandTotalDamaged.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. FLOODED / LANDSLIDE AREAS */}
      <div className="mb-6 space-y-2">
        <h2 className="text-xs font-bold text-black uppercase">Flooded / Landslide Areas</h2>
        <table className="w-full text-xs text-left border border-black border-collapse">
          <thead>
            <tr className="border-b border-black bg-slate-100 font-bold">
              <th className="p-2 border-r border-black w-48">City / Municipality</th>
              <th className="p-2 border-r border-black w-64">Areas</th>
              <th className="p-2">Situation</th>
            </tr>
          </thead>
          <tbody>
            {floodedAreas.length === 0 ? (
              <tr className="border-b border-black">
                <td className="p-2 border-r border-black">Butuan City</td>
                <td className="p-2 border-r border-black italic text-slate-500">None reported</td>
                <td className="p-2 italic text-slate-500">Normal water levels</td>
              </tr>
            ) : (
              floodedAreas.map((f, i) => (
                <tr key={i} className="border-b border-black">
                  <td className="p-2 border-r border-black">Butuan City</td>
                  <td className="p-2 border-r border-black font-medium">
                    Brgy. {f.barangay} {f.sitio && `(${f.sitio})`}
                  </td>
                  <td className="p-2">
                    {f.water_level} {f.remarks && `— ${f.remarks}`}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 6. STATUS OF LIFELINES */}
      <div className="mb-6 space-y-3">
        <h2 className="text-sm font-bold text-black uppercase">Status of Lifelines</h2>

        {/* Roads & Bridges */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-black uppercase">Roads and Bridges</h3>
          <table className="w-full text-xs text-left border border-black border-collapse">
            <thead>
              <tr className="border-b border-black bg-slate-100 font-bold">
                <th className="p-1.5 border-r border-black">Affected Area</th>
                <th className="p-1.5 border-r border-black">Description</th>
                <th className="p-1.5 border-r border-black">Actions Taken</th>
                <th className="p-1.5 border-r border-black">Status</th>
                <th className="p-1.5">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {roads.length === 0 ? (
                <tr className="border-b border-black">
                  <td colSpan={5} className="p-2 text-center italic text-slate-500">
                    All roads and bridges passable.
                  </td>
                </tr>
              ) : (
                roads.map((r, i) => (
                  <tr key={i} className="border-b border-black">
                    <td className="p-1.5 border-r border-black font-medium">{r.affected_area}</td>
                    <td className="p-1.5 border-r border-black">{r.description}</td>
                    <td className="p-1.5 border-r border-black">{r.actions_taken || '-'}</td>
                    <td className="p-1.5 border-r border-black font-bold">{r.status}</td>
                    <td className="p-1.5">{r.remarks || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Power */}
        <div className="space-y-1 pt-1">
          <h3 className="text-xs font-bold text-black uppercase">Power</h3>
          <table className="w-full text-xs text-left border border-black border-collapse">
            <thead>
              <tr className="border-b border-black bg-slate-100 font-bold">
                <th className="p-1.5 border-r border-black">Province/City/Municipality</th>
                <th className="p-1.5 border-r border-black">Barangay</th>
                <th className="p-1.5 border-r border-black">Date and Time of Interruption</th>
                <th className="p-1.5 border-r border-black">Date and Time Restored</th>
                <th className="p-1.5">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {power.length === 0 ? (
                <tr className="border-b border-black">
                  <td colSpan={5} className="p-2 text-center italic text-slate-500">
                    Power transmission stable.
                  </td>
                </tr>
              ) : (
                power.map((p, i) => (
                  <tr key={i} className="border-b border-black">
                    <td className="p-1.5 border-r border-black">Butuan City</td>
                    <td className="p-1.5 border-r border-black font-medium">{p.barangay}</td>
                    <td className="p-1.5 border-r border-black">{p.time_interrupted || '-'}</td>
                    <td className="p-1.5 border-r border-black">{p.time_restored || '-'}</td>
                    <td className="p-1.5">{p.status}: {p.remarks}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Water */}
        <div className="space-y-1 pt-1">
          <h3 className="text-xs font-bold text-black uppercase">Water</h3>
          <table className="w-full text-xs text-left border border-black border-collapse">
            <thead>
              <tr className="border-b border-black bg-slate-100 font-bold">
                <th className="p-1.5 border-r border-black">Province/City/Municipality</th>
                <th className="p-1.5 border-r border-black">Barangay</th>
                <th className="p-1.5 border-r border-black">Date and Time of Interruption</th>
                <th className="p-1.5 border-r border-black">Date and Time Restored</th>
                <th className="p-1.5">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {waterOutages.length === 0 ? (
                <tr className="border-b border-black">
                  <td colSpan={5} className="p-2 text-center italic text-slate-500">
                    Water service operational across all sectors.
                  </td>
                </tr>
              ) : (
                waterOutages.map((w, i) => (
                  <tr key={i} className="border-b border-black">
                    <td className="p-1.5 border-r border-black">Butuan City</td>
                    <td className="p-1.5 border-r border-black font-medium">{w.barangay}</td>
                    <td className="p-1.5 border-r border-black">{w.time_interrupted || '-'}</td>
                    <td className="p-1.5 border-r border-black">{w.time_restored || '-'}</td>
                    <td className="p-1.5">{w.status}: {w.remarks}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. OFFICIAL SIGN-OFF BLOCK (EXACT DROMIC WORD-TEMPLATE STRUCTURE) */}
      <div className="mt-8 border border-black text-xs">
        <div className="grid grid-cols-2 divide-x divide-black">
          
          {/* PREPARED BY */}
          <div className="p-4 flex flex-col justify-between space-y-8">
            <div className="font-bold text-black">Prepared by:</div>

            {/* LSWDO (Interactive Screen Input / Clean Print) */}
            <div className="space-y-0.5">
              <input
                type="text"
                value={preparedByName}
                onChange={(e) => setPreparedByName(e.target.value.toUpperCase())}
                placeholder="[NAME & SIGNATURE]"
                className="w-full font-bold uppercase text-black border-b border-dashed border-slate-400 outline-none pb-0.5 print:hidden bg-transparent"
              />
              <div className="hidden print:block font-bold uppercase text-black">
                {preparedByName || '[Name & Signature]'}
              </div>
              <div className="text-[11px] text-black">LSWDO</div>
            </div>

            {/* LDRRMO */}
            <div className="space-y-0.5 pt-4">
              <div className="font-bold text-black uppercase">
                MARK JULY P. YAP, RN, MPA
              </div>
              <div className="text-[11px] text-black">LDRRMO</div>
            </div>
          </div>

          {/* APPROVED BY */}
          <div className="p-4 flex flex-col justify-between">
            <div className="font-bold text-black">Approved by:</div>

            {/* City Mayor */}
            <div className="space-y-0.5 mt-auto pb-1">
              <div className="font-bold text-black uppercase">
                ATTY. LAWRENCE LEMUEL H. FORTUN
              </div>
              <div className="text-[11px] text-black">
                City/Municipal Mayor
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}