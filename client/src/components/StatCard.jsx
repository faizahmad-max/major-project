import React from 'react';

export function StatCard({ title, value, subtext, icon: Icon, badge, alertLevel = 'default' }) {
  const borderStyles = {
    default: 'border-soc-700/70 hover:border-soc-600',
    critical: 'border-rose-900/60 bg-gradient-to-b from-soc-850 to-rose-950/20',
    warning: 'border-amber-900/60 bg-gradient-to-b from-soc-850 to-amber-950/20',
    success: 'border-emerald-900/50 bg-gradient-to-b from-soc-850 to-emerald-950/20',
  };

  return (
    <div className={`relative bg-soc-850 rounded-lg p-4 border transition-colors ${borderStyles[alertLevel] || borderStyles.default}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-2xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className="text-2xl font-mono font-bold text-white tracking-tight mt-0.5">
            {value}
          </div>
        </div>
        {Icon && (
          <div className="p-2 rounded bg-soc-900 border border-soc-700/60 text-slate-400">
            <Icon className="w-4 h-4 text-slate-300" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-soc-750/60 text-xs text-slate-400">
        <span className="truncate">{subtext}</span>
        {badge && <div className="shrink-0 ml-2">{badge}</div>}
      </div>
    </div>
  );
}
