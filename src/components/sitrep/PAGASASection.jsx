import React from 'react';

export default function PAGASASection({ data, onChange, disabled }) {
  const handleChange = (field, val) => {
    onChange({ ...data, [field]: val });
  };

  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
      <div>
        <h3 className="font-semibold text-slate-800 text-lg">PAGASA Weather & Synoptic Monitoring</h3>
        <p className="text-xs text-slate-500">Official meteorological parameters for the reporting period</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Weather Bulletin Number</label>
          <input
            type="text"
            placeholder="e.g. TC Tropical Cyclone Bulletin #3"
            value={data.bulletin_number || ''}
            disabled={disabled}
            onChange={(e) => handleChange('bulletin_number', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">24-Hour Rainfall Volume</label>
          <input
            type="text"
            placeholder="e.g. 145.2 mm (Torrential)"
            value={data.rainfall_24h || ''}
            disabled={disabled}
            onChange={(e) => handleChange('rainfall_24h', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Wind Signal Level</label>
          <select
            value={data.signal_level || 'NONE'}
            disabled={disabled}
            onChange={(e) => handleChange('signal_level', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm bg-white font-medium"
          >
            <option value="NONE">No Signal Raised</option>
            <option value="TCWS #1">TCWS #1 (39-61 km/h)</option>
            <option value="TCWS #2">TCWS #2 (62-88 km/h)</option>
            <option value="TCWS #3">TCWS #3 (89-117 km/h)</option>
            <option value="TCWS #4">TCWS #4 (118-184 km/h)</option>
            <option value="TCWS #5">TCWS #5 (≥185 km/h)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Official Forecast Summary</label>
        <textarea
          rows={4}
          placeholder="State current weather synopsis, cloud movements, and prevailing monsoon/low pressure condition affecting Butuan City..."
          value={data.forecast || ''}
          disabled={disabled}
          onChange={(e) => handleChange('forecast', e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}