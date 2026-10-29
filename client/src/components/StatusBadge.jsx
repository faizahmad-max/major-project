import React from 'react';

export function StatusBadge({ type, value, size = 'sm' }) {
  const val = String(value || '').toUpperCase();
  const isXs = size === 'xs';
  const pad = isXs ? 'px-1.5 py-0.5 text-2xs' : 'px-2 py-0.5 text-xs';

  if (type === 'severity') {
    if (val === 'HIGH' || val === 'CRITICAL') {
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-semibold rounded ${pad} bg-rose-500/10 text-rose-400 border border-rose-500/30`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          {val}
        </span>
      );
    }
    if (val === 'MEDIUM') {
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-semibold rounded ${pad} bg-amber-500/10 text-amber-400 border border-amber-500/30`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {val}
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded ${pad} bg-sky-500/10 text-sky-400 border border-sky-500/20`}>
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
        LOW
      </span>
    );
  }

  if (type === 'prediction') {
    if (val === 'ANOMALOUS') {
      return (
        <span className={`inline-flex items-center gap-1 font-mono font-semibold rounded ${pad} bg-rose-500/15 text-rose-300 border border-rose-500/40`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          ANOMALY
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 font-mono font-medium rounded ${pad} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        NORMAL
      </span>
    );
  }

  if (type === 'mode') {
    if (val === 'LIVE') {
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-semibold rounded ${pad} bg-emerald-500/15 text-emerald-400 border border-emerald-500/30`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          INTERFACE: LIVE
        </span>
      );
    }
    if (val === 'SIMULATED') {
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded ${pad} bg-sky-500/10 text-sky-400 border border-sky-500/30`}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          SYNTHETIC ENGINE
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded ${pad} bg-slate-800 text-slate-400 border border-slate-700`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        IDLE
      </span>
    );
  }

  if (type === 'status') {
    if (val === 'UNREVIEWED') {
      return (
        <span className={`inline-flex items-center font-mono rounded ${pad} bg-amber-500/10 text-amber-300 border border-amber-500/25`}>
          OPEN
        </span>
      );
    }
    if (val === 'REVIEWED') {
      return (
        <span className={`inline-flex items-center font-mono rounded ${pad} bg-blue-500/10 text-blue-300 border border-blue-500/25`}>
          TRIAGED
        </span>
      );
    }
    if (val === 'RESOLVED') {
      return (
        <span className={`inline-flex items-center font-mono rounded ${pad} bg-emerald-500/10 text-emerald-400 border border-emerald-500/25`}>
          RESOLVED
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center font-mono rounded ${pad} bg-slate-800 text-slate-400 border border-slate-700`}>
        {val}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-mono rounded ${pad} bg-slate-800 text-slate-300 border border-slate-700`}>
      {val}
    </span>
  );
}
