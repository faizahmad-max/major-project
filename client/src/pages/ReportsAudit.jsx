import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Shield,
  Clock,
  Database,
  FileSpreadsheet,
  RefreshCw,
  Terminal,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export function ReportsAudit() {
  const [summary, setSummary] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, logsRes] = await Promise.all([
        api.getReportsSummary(),
        api.getAuditLogs(100)
      ]);
      setSummary(sumRes.stats || {});
      setAuditLogs(logsRes.logs || []);
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-3 font-mono">
      {/* Header */}
      <div className="bg-soc-900 border border-soc-700 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-bold uppercase tracking-wider text-white">
              Compliance Reports & Audit Trails
            </span>
            <span className="text-2xs px-1.5 py-0.2 rounded bg-soc-800 text-slate-400 border border-soc-700">
              SOC2 / ISO 27001
            </span>
          </div>
          <p className="text-2xs text-slate-400 mt-0.5">
            Exportable incident summaries, 5-tuple forensic datasets, and tamper-evident administrative action ledger.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-2xs">
          <button
            onClick={fetchData}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-soc-800 hover:bg-soc-750 border border-soc-700 text-slate-200 transition"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit Ledger</span>
          </button>
        </div>
      </div>

      {/* Export Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-2xs">
        {/* Alerts Export */}
        <div className="p-3.5 rounded bg-soc-900 border border-soc-700 space-y-2">
          <div className="flex items-center space-x-2 text-white font-bold">
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span className="text-xs">Security Incidents & Alerts Log</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-2xs">
            Export structured records of all detected security incidents: severity grading, target sockets, classified threat category, and remediation steps.
          </p>
          <div className="flex items-center space-x-2 pt-1">
            <a
              href={api.getExportUrl('alerts', 'csv')}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold transition"
            >
              <Download className="w-3 h-3" />
              <span>Download CSV</span>
            </a>
            <a
              href={api.getExportUrl('alerts', 'json')}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1 rounded bg-soc-800 hover:bg-soc-750 border border-soc-700 text-slate-300 transition"
            >
              <span>Download JSON</span>
            </a>
          </div>
        </div>

        {/* Traffic Flows Export */}
        <div className="p-3.5 rounded bg-soc-900 border border-soc-700 space-y-2">
          <div className="flex items-center space-x-2 text-white font-bold">
            <FileSpreadsheet className="w-4 h-4 text-sky-400" />
            <span className="text-xs">Raw 5-Tuple Network Traffic Logs</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-2xs">
            Export connection-level flow records: source & destination IP/ports, protocol, packet counts, byte volumes, and ML anomaly verdicts.
          </p>
          <div className="flex items-center space-x-2 pt-1">
            <a
              href={api.getExportUrl('traffic', 'csv')}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold transition"
            >
              <Download className="w-3 h-3" />
              <span>Download CSV</span>
            </a>
            <a
              href={api.getExportUrl('traffic', 'json')}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1 rounded bg-soc-800 hover:bg-soc-750 border border-soc-700 text-slate-300 transition"
            >
              <span>Download JSON</span>
            </a>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-soc-900 border border-soc-700 rounded-lg overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-soc-750 bg-soc-950 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              System Operations Audit Ledger
            </span>
          </div>
          <span className="text-2xs text-slate-500">Immutable forensic actions ({auditLogs.length} events)</span>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full table-dense text-left">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>Operation Event</th>
                <th>Details</th>
                <th>Origin / Actor</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="text-slate-500">#{log.id}</td>
                  <td className="text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp * 1000).toLocaleString()}
                  </td>
                  <td className="text-sky-300 font-semibold">{log.action}</td>
                  <td className="text-slate-300">{log.details}</td>
                  <td>
                    <span className="px-1.5 py-0.2 rounded bg-soc-950 border border-soc-750 text-2xs text-slate-400">
                      {log.source}
                    </span>
                  </td>
                </tr>
              ))}

              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    No administrative audit records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
