// src/components/navigation/AdminSidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar() {
  const { profile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      name: 'Main',
      to: '/admin',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Supervisor ',
      to: '/supervisor',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      name: 'Encoder ',
      to: '/encoder',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      name: 'Hazards',
      to: '/weather',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      )
    }
  ];

  return (
    <aside
      className={`relative bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen transition-all duration-300 font-sans print:hidden select-none z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Floating Edge Toggle Button on Border Line */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-blue-600 text-white shadow-md flex items-center justify-center hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all z-50 cursor-pointer"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-300 ${
            isCollapsed ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Top Header: Logo above CDRRM-IS */}
      <div
        className={`p-5 border-b border-slate-100 flex flex-col items-center justify-center transition-all ${
          isCollapsed ? 'py-4' : 'py-6'
        }`}
      >
        <div className="group flex flex-col items-center cursor-pointer">
          <div className="relative">
            <img
              src="/cdrrmd-logo.jpg"
              alt="CDRRM-IS Logo"
              className={`rounded-2xl object-contain bg-slate-50 border border-slate-200/80 p-1 transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-lg group-hover:border-blue-400 ${
                isCollapsed ? 'w-12 h-12 shadow-xs' : 'w-20 h-20 shadow-sm'
              }`}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://ui-avatars.com/api/?name=CDRRM+IS&background=0284c7&color=fff&rounded=true';
              }}
            />
          </div>

          {!isCollapsed && (
            <div className="text-center mt-3">
              <h1 className="text-sm font-extrabold text-slate-900 tracking-wider transition-colors duration-200 group-hover:text-blue-600">
                CDRRM-IS
              </h1>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="p-3 space-y-1.5 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              } ${isCollapsed ? 'justify-center px-0' : ''}`
            }
          >
            {item.icon}

            {!isCollapsed && <span className="truncate">{item.name}</span>}

            {/* Hover Tooltip when Collapsed */}
            {isCollapsed && (
              <div className="absolute left-full ml-3.5 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                {item.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom User Profile */}
      <div className="p-3 border-t border-slate-100">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200/60 ${
            isCollapsed ? 'justify-center p-1.5' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 uppercase">
            {(profile?.full_name || profile?.email || 'A').charAt(0)}
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {profile?.full_name || 'System Officer'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium uppercase truncate">
                {profile?.role || 'Staff'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}