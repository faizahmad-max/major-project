import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  RefreshCw,
  Download,
  Terminal,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

export function PacketInspection({ latestFlow }) {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('');
  const [predictionFilter, setPredictionFilter] = useState('');
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [page, setPage] = useState(0);
  const limit = 30;

  const fetchFlows = async () => {
    setLoading(true);
    try {
      const res = await api.getTraffic({
        limit,
        offset: page * limit,
        protocol: protocolFilter,
        prediction: predictionFilter,
        search
      });
      setFlows(res.flows || []);
    } catch (err) {
      console.error('Fetch flows error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, [page, protocolFilter, predictionFilter]);

  useEffect(() => {
    if (latestFlow && page === 0) {
      setFlows((prev) => [latestFlow, ...prev.slice(0, limit - 1)]);
    }
  }, [latestFlow]);

  return (
    <div className="space-y-3 font-mono">
      {/* Header Bar */}
      <div className="bg-soc-900 border border-soc-700 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold uppercase tracking-wider text-white">
              Flow Telemetry & Packet Inspection
            </span>
            <span className="text-2xs px-1.5 py-0.2 rounded bg-soc-800 text-slate-400 border border-soc-700">
              ZEEK/IPFIX SCHEMA
            </span>
          </div>
          <p className="text-2xs text-slate-400 mt-0.5">
            Bi-directional connection summaries, transport layer flags, volumetric byte counters, and ML scores.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-2xs">
          <a
            href={api.getExportUrl('traffic', 'csv')}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-soc-800 hover:bg-soc-750 border border-soc-700 text-slate-200 transition"
          >
            <Download className="w-3 h-3" />
            <span>Export CSV</span>
          </a>
          <button
            onClick={fetchFlows}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-soc-800 hover:bg-soc-750 border border-soc-700 text-slate-200 transition"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter / Query Strip */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-soc-900 border border-soc-700 rounded-lg p-2.5 text-2xs">
        <div className="relative md:col-span-6">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter query (e.g. 192.168.1.100, port:80, DoS)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchFlows()}
            className="w-full bg-soc-950 border border-soc-750 rounded pl-8 pr-2 py-1 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-soc-600 font-mono text-2xs"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={protocolFilter}
            onChange={(e) => { setProtocolFilter(e.target.value); setPage(0); }}
            className="w-full bg-soc-950 border border-soc-750 rounded px-2 py-1 text-slate-300 focus:outline-none font-mono text-2xs"
          >
            <option value="">Protocol: ALL</option>
            <option value="TCP">Protocol: TCP</option>
            <option value="UDP">Protocol: UDP</option>
            <option value="ICMP">Protocol: ICMP</option>
            <option value="OTHER">Protocol: OTHER</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={predictionFilter}
            onChange={(e) => { setPredictionFilter(e.target.value); setPage(0); }}
            className="w-full bg-soc-950 border border-soc-750 rounded px-2 py-1 text-slate-300 focus:outline-none font-mono text-2xs"
          >
            <option value="">Verdict: ALL</option>
            <option value="NORMAL">Verdict: NORMAL</option>
            <option value="ANOMALOUS">Verdict: ANOMALOUS</option>
          </select>
        </div>
      </div>

      {/* Primary Log Data Table */}
      <div className="bg-soc-900 border border-soc-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-dense text-left">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Source Socket</th>
                <th>Dir</th>
                <th>Destination Socket</th>
                <th>Proto</th>
                <th>Duration</th>
                <th>Packets</th>
                <th>Bytes</th>
                <th>Rate (P/s)</th>
                <th>Verdict</th>
                <th>Score</th>
                <th>Attack Signature</th>
                <th className="text-right">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {flows.map((flow, index) => (
                <tr
                  key={flow.id || index}
                  onClick={() => setSelectedFlow(flow)}
                  className="cursor-pointer"
                >
                  <td className="text-slate-400 whitespace-nowrap">
                    {new Date(flow.timestamp * 1000).toLocaleTimeString()}
                  </td>
                  <td className="text-sky-400 whitespace-nowrap">
                    {flow.src_ip}:{flow.src_port || 0}
                  </td>
                  <td className="text-slate-600">→</td>
                  <td className="text-slate-200 whitespace-nowrap">
                    {flow.dst_ip}:{flow.dst_port || 0}
                  </td>
                  <td className="text-slate-400 font-semibold">{flow.protocol}</td>
                  <td className="text-slate-400">{Number(flow.duration || 0).toFixed(3)}s</td>
                  <td className="text-slate-300">{Number(flow.packet_count).toLocaleString()}</td>
                  <td className="text-slate-300">{Number(flow.byte_count).toLocaleString()} B</td>
                  <td className="text-slate-400">{Number(flow.packet_rate || 0).toFixed(1)}</td>
                  <td>
                    <StatusBadge type="prediction" value={flow.prediction} size="xs" />
                  </td>
                  <td className="font-bold">
                    <span className={flow.anomaly_score >= 0.65 ? 'text-rose-400' : 'text-slate-400'}>
                      {Number(flow.anomaly_score || 0).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    {flow.attack_type ? (
                      <span className="text-rose-400 font-semibold text-2xs">{flow.attack_type}</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedFlow(flow); }}
                      className="p-1 rounded hover:bg-soc-800 text-slate-400 hover:text-white transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {flows.length === 0 && !loading && (
                <tr>
                  <td colSpan={13} className="text-center py-10 text-slate-500">
                    No connection flows matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-soc-950 border-t border-soc-750 text-2xs text-slate-400">
          <span>Page {page + 1} (showing {flows.length} rows)</span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2.5 py-0.5 rounded bg-soc-900 border border-soc-750 disabled:opacity-40 hover:bg-soc-800"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={flows.length < limit}
              className="px-2.5 py-0.5 rounded bg-soc-900 border border-soc-750 disabled:opacity-40 hover:bg-soc-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Forensic Inspection Modal */}
      <Modal
        isOpen={!!selectedFlow}
        onClose={() => setSelectedFlow(null)}
        title="Session Flow Forensic Dissection"
        maxWidth="max-w-4xl"
      >
        {selectedFlow && (
          <div className="space-y-4 text-xs font-mono">
            {/* Header Status */}
            <div className="flex items-center justify-between p-3 rounded bg-soc-950 border border-soc-750">
              <div className="flex items-center space-x-2">
                <StatusBadge type="prediction" value={selectedFlow.prediction} />
                <span className="font-semibold text-white">
                  {selectedFlow.attack_type || 'Verified Normal Telemetry'}
                </span>
              </div>
              <div className="text-right text-slate-400">
                Score: <strong className="text-white text-sm">{Number(selectedFlow.anomaly_score || 0).toFixed(3)}</strong>
              </div>
            </div>

            {/* Socket Endpoints Grid */}
            <div className="grid grid-cols-2 gap-2 text-2xs">
              <div className="p-2.5 rounded bg-soc-950 border border-soc-750">
                <span className="text-slate-500 block uppercase">Source Socket</span>
                <span className="text-sky-300 font-bold text-xs mt-0.5 block">
                  {selectedFlow.src_ip}:{selectedFlow.src_port || 0}
                </span>
              </div>
              <div className="p-2.5 rounded bg-soc-950 border border-soc-750">
                <span className="text-slate-500 block uppercase">Destination Socket</span>
                <span className="text-slate-200 font-bold text-xs mt-0.5 block">
                  {selectedFlow.dst_ip}:{selectedFlow.dst_port || 0}
                </span>
              </div>
            </div>

            {/* Granular Flow Attributes */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-2xs">
              <div className="p-2 bg-soc-950 rounded border border-soc-750">
                <span className="text-slate-500 block">Proto</span>
                <span className="font-semibold text-white">{selectedFlow.protocol}</span>
              </div>
              <div className="p-2 bg-soc-950 rounded border border-soc-750">
                <span className="text-slate-500 block">Duration</span>
                <span className="font-semibold text-white">{Number(selectedFlow.duration).toFixed(4)}s</span>
              </div>
              <div className="p-2 bg-soc-950 rounded border border-soc-750">
                <span className="text-slate-500 block">Packets</span>
                <span className="font-semibold text-white">{selectedFlow.packet_count}</span>
              </div>
              <div className="p-2 bg-soc-950 rounded border border-soc-750">
                <span className="text-slate-500 block">Volume</span>
                <span className="font-semibold text-white">{selectedFlow.byte_count} B</span>
              </div>
              <div className="p-2 bg-soc-950 rounded border border-soc-750">
                <span className="text-slate-500 block">Packet Rate</span>
                <span className="font-semibold text-white">{Number(selectedFlow.packet_rate || 0).toFixed(1)}/s</span>
              </div>
              <div className="p-2 bg-soc-950 rounded border border-soc-750">
                <span className="text-slate-500 block">Engine</span>
                <span className="font-semibold text-sky-400">{selectedFlow.model || 'Detector'}</span>
              </div>
            </div>

            {/* Contributing Indicators */}
            {selectedFlow.explanation && selectedFlow.explanation.length > 0 && (
              <div className="p-3 rounded bg-soc-950 border border-soc-750 text-2xs space-y-1">
                <span className="text-sky-400 font-semibold uppercase tracking-wider block">Contributing Anomaly Indicators:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                  {selectedFlow.explanation.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Raw JSON Record */}
            <div>
              <span className="text-slate-400 block mb-1 text-2xs uppercase tracking-wider">Raw Connection Descriptor:</span>
              <pre className="p-2.5 rounded bg-soc-950 border border-soc-750 text-2xs text-slate-300 overflow-x-auto max-h-40">
                {JSON.stringify(selectedFlow, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
