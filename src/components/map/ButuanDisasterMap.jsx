// src/components/map/ButuanDisasterMap.jsx
import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import rawBoundary from '../../data/Boundary.json';

export default function ButuanDisasterMap({ cases = [] }) {
  const [hoveredBarangay, setHoveredBarangay] = useState(null);

  // 1. Sanitize & Normalize GeoJSON safely
  const geoJsonData = useMemo(() => {
    try {
      if (!rawBoundary) return null;

      // Handle ES module default export if imported as object
      const data = rawBoundary.default || rawBoundary;

      // Ensure it is a valid GeoJSON FeatureCollection or Feature
      if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
        return data;
      }
      if (data.type === 'Feature') {
        return { type: 'FeatureCollection', features: [data] };
      }

      console.warn('Boundary.json structure does not match FeatureCollection:', data);
      return null;
    } catch (err) {
      console.error('Failed to parse Boundary.json:', err);
      return null;
    }
  }, []);

  // Filter valid case pins
  const validCases = useMemo(() => {
    return (cases || []).filter(
      (c) =>
        c.latitude &&
        c.longitude &&
        !isNaN(Number(c.latitude)) &&
        !isNaN(Number(c.longitude))
    );
  }, [cases]);

  // Aggregate stats per barangay name from incident cases
  const barangayImpactMap = useMemo(() => {
    const map = {};
    (cases || []).forEach((c) => {
      const name = (c.barangay || '').trim().toUpperCase();
      if (!name) return;
      if (!map[name]) {
        map[name] = { families: 0, individuals: 0, casesCount: 0 };
      }
      map[name].families += Number(c.family) || 0;
      map[name].individuals += Number(c.individual) || 0;
      map[name].casesCount += 1;
    });
    return map;
  }, [cases]);

  // GeoJSON Polygon Styling
  const styleFeature = (feature) => {
    const props = feature.properties || {};
    // Check possible GeoJSON name properties
    const brgyName = (
      props.BARANGAY ||
      props.NAME_3 ||
      props.ADM4_EN ||
      props.brgy_name ||
      props.name ||
      ''
    ).trim().toUpperCase();

    const stats = barangayImpactMap[brgyName];
    const hasImpact = stats && stats.casesCount > 0;

    return {
      fillColor: hasImpact ? '#ef4444' : '#3b82f6',
      weight: 1.5,
      opacity: 0.8,
      color: '#1e40af',
      fillOpacity: hasImpact ? 0.35 : 0.08,
    };
  };

  // Hover and interaction listeners for each polygon
  const onEachFeature = (feature, layer) => {
    const props = feature.properties || {};
    const brgyName =
      props.BARANGAY ||
      props.NAME_3 ||
      props.ADM4_EN ||
      props.brgy_name ||
      props.name ||
      'Barangay';

    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          weight: 3,
          color: '#1d4ed8',
          fillOpacity: 0.5,
        });
        l.bringToFront();

        const stats = barangayImpactMap[brgyName.trim().toUpperCase()] || {
          families: 0,
          individuals: 0,
          casesCount: 0,
        };
        setHoveredBarangay({ name: brgyName, ...stats });
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(styleFeature(feature));
        setHoveredBarangay(null);
      },
    });
  };

  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 font-sans">
      {/* Floating Spatial Info Card on Hover */}
      {hoveredBarangay && (
        <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200 shadow-lg text-xs space-y-1 min-w-[180px]">
          <div className="font-bold text-slate-900 border-b pb-1">
            {hoveredBarangay.name}
          </div>
          <div className="text-slate-600 flex justify-between">
            <span>Incident Cases:</span>
            <strong className="text-slate-900">{hoveredBarangay.casesCount}</strong>
          </div>
          <div className="text-slate-600 flex justify-between">
            <span>Affected Families:</span>
            <strong className="text-slate-900">{hoveredBarangay.families}</strong>
          </div>
          <div className="text-slate-600 flex justify-between">
            <span>Displaced Persons:</span>
            <strong className="text-blue-600">{hoveredBarangay.individuals}</strong>
          </div>
        </div>
      )}

      {/* Butuan City Coordinates: [8.9492, 125.5430] */}
      <MapContainer
        center={[8.9492, 125.5430]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Safe GeoJSON Render: Only rendered if data is verified valid */}
        {geoJsonData && (
          <GeoJSON
            key={JSON.stringify(geoJsonData).length}
            data={geoJsonData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Case Location Pin Markers */}
        {validCases.map((c) => (
          <CircleMarker
            key={c.id || `${c.latitude}-${c.longitude}`}
            center={[Number(c.latitude), Number(c.longitude)]}
            radius={7}
            pathOptions={{
              fillColor: '#dc2626',
              fillOpacity: 0.9,
              color: '#ffffff',
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-xs p-1 space-y-1">
                <div className="font-bold text-slate-900">
                  {c.case_id || 'Incident Case'}
                </div>
                <div className="text-slate-600">
                  <strong>Brgy:</strong> {c.barangay} {c.purok ? `(${c.purok})` : ''}
                </div>
                {c.landmark && (
                  <div className="text-slate-500 text-[11px]">
                    📍 {c.landmark}
                  </div>
                )}
                <div className="text-slate-700 pt-1 border-t text-[11px]">
                  <strong>{c.family || 0}</strong> Families •{' '}
                  <strong>{c.individual || 0}</strong> Persons
                </div>
                {c.evacuation_center && (
                  <div className="text-blue-700 font-medium text-[11px]">
                    EC: {c.evacuation_center} ({c.evacuation_type || 'Inside'})
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}