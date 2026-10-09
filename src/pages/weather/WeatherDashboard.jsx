// src/pages/weather/WeatherDashboard.jsx
import React, { useState } from 'react';

export default function WeatherDashboard() {
  const [activeTab, setActiveTab] = useState('weather');

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Tab Bar Header */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('weather')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'weather'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            Weather
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('earthquake')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'earthquake'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            Earthquake
          </button>
        </div>

        {/* Tab 1: Weather (Map on top, Forecast on bottom) */}
        {activeTab === 'weather' && (
          <div className="space-y-4">
            <div className="w-full h-[520px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <iframe
                width="100%"
                height="100%"
                src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=5&overlay=rain&product=ecmwf&level=surface&lat=11.389&lon=121.804&detailLat=8.832851899967842&detailLon=125.4610562324524&marker=true"
                title="Weather Map"
                frameBorder="0"
                className="w-full h-full border-0"
              />
            </div>

            <div className="w-full h-[250px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <iframe
                width="100%"
                height="100%"
                src="https://embed.windy.com/embed.html?type=forecast&location=coordinates&detail=true&lat=8.9538&lon=125.5285&detailLat=8.953862747073213&detailLon=125.52845783007344&metricTemp=default&metricRain=default&metricWind=default"
                title="Weather Forecast"
                frameBorder="0"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Earthquake */}
        {activeTab === 'earthquake' && (
          <div className="w-full h-[780px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <iframe
              src="https://lkforge.com/embed/earthquake-tracker/?place=Butuan"
              width="100%"
              height="100%"
              loading="lazy"
              title="Earthquake Tracker"
              className="w-full h-full border-0"
            />
          </div>
        )}

      </div>
    </div>
  );
}