import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  FlaskConical,
  BellRing,
  Globe,
  Cpu,
  FileText,
  HardDrive,
  Activity,
  CheckCircle2
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: 'OPERATIONS',
    items: [
      { name: 'Operations Center', path: '/', icon: LayoutDashboard },
      { name: 'Flow Telemetry', path: '/inspection', icon: Search },
    ]
  },
  {
    title: 'DETECTION & ML',
    items: [
      { name: 'Anomaly Lab', path: '/lab', icon: FlaskConical },
      { name: 'Model Registry', path: '/models', icon: Cpu },
    ]
  },
  {
    title: 'INCIDENT RESPONSE',
    items: [
      { name: 'Alerts & Triage', path: '/alerts', icon: BellRing, badgeCount: true },
      { name: 'Threat Intel Feeds', path: '/threat-intel', icon: Globe },
    ]
  },
  {
    title: 'COMPLIANCE',
    items: [
      { name: 'Audit & Reports', path: '/reports', icon: FileText },
    ]
  }
];

export function Sidebar({ unreviewedAlertCount = 0 }) {
  return (
    <aside className="w-56 min-h-[calc(100vh-49px)] bg-soc-950 border-r border-soc-700/80 p-3 flex flex-col justify-between shrink-0 text-xs font-mono">
      <div className="space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-2.5 text-2xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
              {section.title}
            </p>
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-xs ${
                        isActive
                          ? 'bg-soc-800 text-sky-400 font-medium border-l-2 border-sky-400 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-soc-900'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badgeCount && unreviewedAlertCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.2 text-2xs font-semibold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        {unreviewedAlertCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Collector Daemon Status Widget */}
      <div className="p-2.5 rounded bg-soc-900 border border-soc-750 text-2xs space-y-1.5 text-slate-400">
        <div className="flex items-center justify-between text-slate-300 font-semibold">
          <div className="flex items-center space-x-1.5">
            <HardDrive className="w-3 h-3 text-sky-400" />
            <span>AGENT TELEMETRY</span>
          </div>
          <span className="flex items-center space-x-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>0.12ms</span>
          </span>
        </div>
        <div className="space-y-1 text-slate-500 pt-1 border-t border-soc-750">
          <div className="flex justify-between">
            <span>Buffer:</span>
            <span className="text-slate-300">500 slots (Ring)</span>
          </div>
          <div className="flex justify-between">
            <span>Storage:</span>
            <span className="text-slate-300">SQLite (Synced)</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
