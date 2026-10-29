import React, { useState, useEffect } from 'react';
import {
  BellRing,
  CheckCircle,
  AlertOctagon,
  Filter,
  Search,
  ExternalLink,
  ShieldAlert,
  Download,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

const MITRE_MAP = {
  DoS: { id: 'T1498', name: 'Network Denial of Service', tactic: 'Impact' },
  PortScan: { id: 'T1046', name: 'Network Service Discovery', tactic: 'Discovery' },
  BruteForce: { id: 'T1110', name: 'Brute Force Authentication', tactic: 'Credential Access' },
  DataExfiltration: { id: 'T1041', name: 'Exfiltration Over C2 Channel', tactic: 'Exfiltration' },
  UnknownAnomaly: { id: 'T1205', name: 'Traffic Signaling & Divergence', tactic: 'Defense Evasion' }
};

export function AlertsCenter({ latestAlert }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getAlerts({
        severity: severityFilter,
        status: statusFilter,
        limit: 100
      });
      const list = res.alerts || [];
      setAlerts(list);
      if (list.length > 0 && !selectedAlert) {
        setSelectedAlert(list[0]);
      }
    } catch (err) {
      console.error('Fetch alerts error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  useEffect(() => {
    if (latestAlert) {
      setAlerts((prev) => [latestAlert, ...prev]);
    }
  }, [latestAlert]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await api.reviewAlert(id, newStatus);
      setAlerts((prev) => prev.map((a) => (a.id === id ? res.alert : a)));
      if (selectedAlert?.id === id) {
        setSelectedAlert(res.alert);
      }
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const getMitre = (attackType) => {
    return MITRE_MAP[attackType] || MITRE_MAP.UnknownAnomaly;
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Header */}
      <div className="bg-soc-900 border border-soc-700 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold uppercase tracking-wider text-white">
              Incident Response & Triage Center
            </span>
            <span className="text-2xs px-1.5 py-0.2 rounded bg-soc-800 text-slate-400 border border-soc-700">
              SOC TIER 1/2 QUEUE
            </span>
          </div>
          <p className="text-2xs text-slate-400 mt-0.5">
            Automated anomaly alert correlation, MITRE ATT&CK framework mapping, and defensive remediation playbooks.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-2xs">
          <a
            href={api.getExportUrl('alerts', 'csv')}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-soc-800 hover:bg-soc-750 border border-soc-700 text-slate-200 transition"
          >
            <Download className="w-3 h-3" />
            <span>Export Incident Log</span>
          </a>
          <button
            onClick={fetchAlerts}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-soc-800 hover:bg-soc-750 border border-soc-700 text-slate-200 transition"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-soc-900 border border-soc-700 rounded-lg p-2.5 text-2xs">
        <div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full bg-soc-950 border border-soc-750 rounded px-2 py-1 text-slate-200 focus:outline-none font-mono"
          >
            <option value="">Severity: ALL</option>
            <option value="HIGH">Severity: HIGH / CRITICAL</option>
            <option value="MEDIUM">Severity: MEDIUM</option>
            <option value="LOW">Severity: LOW</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-soc-950 border border-soc-750 rounded px-2 py-1 text-slate-200 focus:outline-none font-mono"
          >
            <option value="">Status: ALL</option>
            <option value="UNREVIEWED">Status: OPEN / UNREVIEWED</option>
            <option value="REVIEWED">Status: TRIAGED</option>
            <option value="RESOLVED">Status: RESOLVED</option>
          </select>
        </div>

        <div className="col-span-2 flex items-center justify-end space-x-2 text-2xs text-slate-500">
          <span>Total Incidents: <strong className="text-white">{alerts.length}</strong></span>
          <span>•</span>
          <span>Open: <strong className="text-amber-400">{alerts.filter(a => a.status === 'UNREVIEWED').length}</strong></span>
        </div>
      </div>

      {/* Split Triage View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: Queue List */}
        <div className="lg:col-span-6 space-y-1.5 max-h-[680px] overflow-y-auto">
          {alerts.map((alert) => {
            const isSel = selectedAlert?.id === alert.id;
            const mitre = getMitre(alert.attack_type);
            return (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`p-3 rounded border transition cursor-pointer text-2xs space-y-2 ${
                  isSel
                    ? 'bg-soc-800 border-sky-500'
                    : 'bg-soc-900 border-soc-700 hover:border-soc-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusBadge type="severity" value={alert.severity} size="xs" />
                    <span className="font-mono text-slate-400">INC-{String(alert.id).padStart(4, '0')}</span>
                    <span className="font-semibold text-white">{alert.title}</span>
                  </div>
                  <StatusBadge type="status" value={alert.status} size="xs" />
                </div>

                <div className="flex items-center justify-between text-slate-400 text-2xs">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-sky-300">{alert.src_ip}</span>
                    <span>→</span>
                    <span className="text-slate-200">{alert.dst_ip}:{alert.dst_port}</span>
                  </div>
                  <span className="text-slate-500 shrink-0">
                    {new Date(alert.timestamp * 1000).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2 pt-1 border-t border-soc-750 text-2xs">
                  <span className="px-1 py-0.2 rounded bg-soc-950 text-slate-400 border border-soc-750">
                    {mitre.id}: {mitre.name}
                  </span>
                  <span className="text-slate-500">Engine: {alert.model}</span>
                </div>
              </div>
            );
          })}

          {alerts.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500 text-xs bg-soc-900 rounded border border-soc-700">
              Zero security incidents recorded in this queue filter.
            </div>
          )}
        </div>

        {/* Right: Detailed Incident Investigation Deck */}
        <div className="lg:col-span-6 bg-soc-900 border border-soc-700 rounded-lg p-4 space-y-3">
          <div className="border-b border-soc-750 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Incident Investigation & Defensive Playbook
            </span>
          </div>

          {selectedAlert ? (
            <div className="space-y-3 text-2xs">
              <div className="p-3 rounded bg-soc-950 border border-soc-750 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase">Incident Identifier:</span>
                  <span className="font-bold text-white text-xs font-mono">INC-{String(selectedAlert.id).padStart(4, '0')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase">Severity Evaluation:</span>
                  <StatusBadge type="severity" value={selectedAlert.severity} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase">Classifying Engine:</span>
                  <span className="text-sky-300 font-bold">{selectedAlert.model}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase">Anomaly Score:</span>
                  <span className="text-rose-400 font-bold text-xs">{Number(selectedAlert.anomaly_score).toFixed(3)}</span>
                </div>
              </div>

              {/* MITRE ATT&CK Matrix Tagging */}
              {(() => {
                const mitre = getMitre(selectedAlert.attack_type);
                return (
                  <div className="p-3 rounded bg-soc-950 border border-soc-750 space-y-1">
                    <span className="text-slate-500 uppercase text-2xs font-semibold block">MITRE ATT&CK Framework Mapping:</span>
                    <div className="flex items-center space-x-2 text-white font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300">
                        {mitre.id}
                      </span>
                      <span>{mitre.name}</span>
                    </div>
                    <span className="text-slate-400 block text-2xs">Tactic Category: {mitre.tactic}</span>
                  </div>
                );
              })()}

              {/* Socket Endpoints */}
              <div className="grid grid-cols-2 gap-2 text-2xs">
                <div className="p-2.5 rounded bg-soc-950 border border-soc-750">
                  <span className="text-slate-500 block uppercase">Source Ingress</span>
                  <span className="text-sky-300 font-bold mt-0.5 block">{selectedAlert.src_ip}</span>
                </div>
                <div className="p-2.5 rounded bg-soc-950 border border-soc-750">
                  <span className="text-slate-500 block uppercase">Destination Socket</span>
                  <span className="text-slate-200 font-bold mt-0.5 block">{selectedAlert.dst_ip}:{selectedAlert.dst_port} ({selectedAlert.protocol})</span>
                </div>
              </div>

              {/* Observable Contributing Features */}
              <div className="p-3 rounded bg-soc-950 border border-soc-750 space-y-1">
                <span className="text-slate-500 uppercase font-semibold block">Observable Evidence:</span>
                <p className="text-slate-300 leading-relaxed">{selectedAlert.contributing_factors}</p>
              </div>

              {/* Defensive Remediation Playbook */}
              <div className="p-3 rounded bg-soc-950 border border-soc-750 space-y-1">
                <div className="flex items-center space-x-1.5 text-sky-400 font-semibold uppercase">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Defensive Containment Guidance:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{selectedAlert.remediation}</p>
              </div>

              {/* Status Update Actions */}
              <div className="pt-2 border-t border-soc-750 space-y-1.5">
                <span className="text-slate-500 uppercase text-2xs block">Update Incident Status:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'REVIEWED')}
                    className="py-1 rounded bg-soc-800 hover:bg-soc-750 border border-soc-700 text-blue-300 font-semibold"
                  >
                    Triage In-Progress
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'RESOLVED')}
                    className="py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-semibold"
                  >
                    Resolve Incident
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'DISMISSED')}
                    className="py-1 rounded bg-soc-800 hover:bg-soc-750 border border-soc-700 text-slate-400 font-semibold"
                  >
                    False Positive
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 text-xs">
              Select an incident from the queue to review evidence and apply triage updates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
