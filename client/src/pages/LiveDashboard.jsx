import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Radio,
  Play,
  Square,
  Server,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
  HardDrive
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';

const PROTO_COLORS = {
  TCP: '#0284c7',
  UDP: '#38bdf8',
  ICMP: '#a855f7',
  OTHER: '#64748b'
};

export function LiveDashboard({ summary, systemStatus, flowHistory, latestAlert }) {
  const [interfaces, setInterfaces] = useState([]);
  const [selectedInterface, setSelectedInterface] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState(null);
  const [simScenario, setSimScenario] = useState('normal');
  const [simSpeed, setSimSpeed] = useState(2.0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [chartData, setChartData] = useState([]);

  // Load network adapters
  useEffect(() => {
    api.getInterfaces()
      .then((res) => {
        if (res.interfaces && res.interfaces.length > 0) {
          setInterfaces(res.interfaces);
          const firstUp = res.interfaces.find(i => i.is_up);
          setSelectedInterface(firstUp ? firstUp.name : res.interfaces[0].name);
        }
      })
      .catch((err) => console.warn('Interfaces fetch warning:', err));
  }, []);

  useEffect(() => {
    if (systemStatus?.capture) {
      setIsCapturing(systemStatus.capture.is_capturing);
      if (systemStatus.capture.last_error) {
        setCaptureError(systemStatus.capture.last_error);
      }
    }
    if (systemStatus?.simulation) {
      setIsSimulating(systemStatus.simulation.is_running);
    }
  }, [systemStatus]);

  // Rolling chart telemetry
  useEffect(() => {
    if (flowHistory.length > 0) {
      const formatted = flowHistory.slice(0, 24).reverse().map((f) => ({
        time: new Date(f.timestamp * 1000).toLocaleTimeString().slice(3),
        packet_rate: Math.round(Number(f.packet_rate) || 0),
        byte_rate_kb: Math.round((Number(f.byte_rate) || 0) / 1024),
        score: Math.round((Number(f.anomaly_score) || 0) * 100)
      }));
      setChartData(formatted);
    }
  }, [flowHistory]);

  const handleStartCapture = async () => {
    setCaptureError(null);
    try {
      const res = await api.startCapture(selectedInterface);
      if (res.last_error) {
        setCaptureError(res.last_error);
      } else {
        setIsCapturing(true);
        setIsSimulating(false);
      }
    } catch (err) {
      setCaptureError(err.message);
    }
  };

  const handleStopCapture = async () => {
    try {
      await api.stopCapture();
      setIsCapturing(false);
    } catch (err) {
      setCaptureError(err.message);
    }
  };

  const handleStartSimulation = async () => {
    try {
      await api.startSimulation(simScenario, simSpeed);
      setIsSimulating(true);
      setIsCapturing(false);
      setCaptureError(null);
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    }
  };

  const handleStopSimulation = async () => {
    try {
      await api.stopSimulation();
      setIsSimulating(false);
    } catch (err) {
      console.error(err);
    }
  };

  const totalFlows = summary?.total_flows || 0;
  const normalCount = summary?.normal_count || 0;
  const anomalousCount = summary?.anomalous_count || 0;
  const anomalyPct = summary?.anomaly_percentage || 0;
  const recentAlerts = summary?.recent_alerts || [];

  const protocolData = [
    { name: 'TCP', value: summary?.protocol_breakdown?.TCP || 0 },
    { name: 'UDP', value: summary?.protocol_breakdown?.UDP || 0 },
    { name: 'ICMP', value: summary?.protocol_breakdown?.ICMP || 0 },
    { name: 'OTHER', value: summary?.protocol_breakdown?.OTHER || 0 }
  ];

  return (
    <div className="space-y-4 font-mono">
      {/* Top Operations Action Bar */}
      <div className="bg-soc-900 border border-soc-700 rounded-lg p-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Network Telemetry Operations
                </span>
                <StatusBadge
                  type="mode"
                  value={isCapturing ? 'LIVE' : (isSimulating ? 'SIMULATED' : 'IDLE')}
                  size="xs"
                />
              </div>
              <p className="text-2xs text-slate-400 mt-0.5">
                Multi-threaded Scapy aggregation & synthetic telemetry generator feeding 4 real-time ML classifiers.
              </p>
            </div>
          </div>

          {/* Dual Ingestion Controls */}
          <div className="flex flex-wrap items-center gap-2 text-2xs">
            {/* Live Interface Selector */}
            <div className="flex items-center space-x-1.5 bg-soc-950 px-2 py-1 rounded border border-soc-750">
              <span className="text-slate-500 uppercase">Adapter:</span>
              <select
                value={selectedInterface}
                onChange={(e) => setSelectedInterface(e.target.value)}
                disabled={isCapturing}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                {interfaces.map((iface) => (
                  <option key={iface.name} value={iface.name} className="bg-soc-900 text-white">
                    {iface.name} ({iface.ip_address})
                  </option>
                ))}
                {interfaces.length === 0 && <option value="" className="bg-soc-900">No adapters</option>}
              </select>

              {isCapturing ? (
                <button
                  onClick={handleStopCapture}
                  className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition font-semibold"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleStartCapture}
                  className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition font-semibold"
                >
                  Capture
                </button>
              )}
            </div>

            {/* Synthetic Injector */}
            <div className="flex items-center space-x-1.5 bg-soc-950 px-2 py-1 rounded border border-soc-750">
              <span className="text-slate-500 uppercase">Scenario:</span>
              <select
                value={simScenario}
                onChange={(e) => setSimScenario(e.target.value)}
                disabled={isSimulating}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-2xs"
              >
                <option value="normal" className="bg-soc-900 text-white">Normal Baseline</option>
                <option value="syn_flood" className="bg-soc-900 text-white">DoS SYN Flood</option>
                <option value="port_scan" className="bg-soc-900 text-white">Port Scan Sweep</option>
                <option value="brute_force" className="bg-soc-900 text-white">SSH/RDP Brute Force</option>
                <option value="data_exfiltration" className="bg-soc-900 text-white">Exfiltration Stream</option>
                <option value="mixed" className="bg-soc-900 text-white">Mixed Organic</option>
              </select>

              {isSimulating ? (
                <button
                  onClick={handleStopSimulation}
                  className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition font-semibold"
                >
                  Halt
                </button>
              ) : (
                <button
                  onClick={handleStartSimulation}
                  className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 hover:bg-sky-900 transition font-semibold"
                >
                  Inject
                </button>
              )}
            </div>
          </div>
        </div>

        {captureError && (
          <div className="mt-2.5 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-2xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span><strong>Adapter Notice:</strong> {captureError}</span>
            </div>
            <span className="text-slate-400 hidden md:inline">Mode B (Synthetic Simulation) operates natively without Npcap.</span>
          </div>
        )}
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Observed Flows"
          value={totalFlows.toLocaleString()}
          subtext="Persisted connection sessions"
          icon={Activity}
          badge={<span className="text-2xs text-slate-400">Ring: 500 max</span>}
        />
        <StatCard
          title="Baseline Compliant"
          value={normalCount.toLocaleString()}
          subtext={`${totalFlows > 0 ? ((normalCount / totalFlows) * 100).toFixed(1) : 100}% verified benign`}
          icon={ShieldCheck}
          alertLevel="success"
        />
        <StatCard
          title="Anomalies Flagged"
          value={anomalousCount.toLocaleString()}
          subtext="Divergent 5-tuple profiles"
          icon={AlertTriangle}
          alertLevel={anomalousCount > 0 ? 'critical' : 'default'}
        />
        <StatCard
          title="Threat Ratio"
          value={`${anomalyPct}%`}
          subtext="Calculated divergence rate"
          icon={TrendingUp}
          alertLevel={anomalyPct > 20 ? 'critical' : (anomalyPct > 5 ? 'warning' : 'default')}
        />
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Bandwidth & Ingestion Volume Chart */}
        <div className="lg:col-span-8 bg-soc-900 border border-soc-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3 border-b border-soc-750 pb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Throughput & Ingestion Intensity
              </h3>
              <p className="text-2xs text-slate-400">Real-time packet velocity (Pkts/s) vs byte volume (KB/s)</p>
            </div>
            <div className="flex items-center space-x-3 text-2xs">
              <span className="flex items-center space-x-1 text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Packets/s</span>
              </span>
              <span className="flex items-center space-x-1 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>KB/s</span>
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="purpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#1f283c" />
                <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                <YAxis stroke="#475569" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d111a', borderColor: '#28344d', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Area type="monotone" dataKey="packet_rate" stroke="#0284c7" strokeWidth={1.5} fillOpacity={1} fill="url(#skyGrad)" />
                <Area type="monotone" dataKey="byte_rate_kb" stroke="#a855f7" strokeWidth={1.5} fillOpacity={1} fill="url(#purpGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* L4 Protocol Breakdown */}
        <div className="lg:col-span-4 bg-soc-900 border border-soc-700 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-soc-750 pb-2 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Layer 4 Protocols
              </h3>
              <p className="text-2xs text-slate-400">Transport protocol session distribution</p>
            </div>

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={protocolData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1f283c" />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0d111a', borderColor: '#28344d', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }} />
                  <Bar dataKey="value" fill="#0284c7" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-soc-750 text-2xs">
            {protocolData.map((p) => (
              <div key={p.name} className="flex items-center justify-between px-2 py-1 bg-soc-950 rounded border border-soc-750">
                <span className="text-slate-400">{p.name}:</span>
                <span className="text-white font-bold">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-Time Live Feed & Security Alerts Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Real-time Ingestion Feed Table */}
        <div className="lg:col-span-7 bg-soc-900 border border-soc-700 rounded-lg overflow-hidden flex flex-col">
          <div className="px-3.5 py-2.5 border-b border-soc-750 bg-soc-950 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Real-Time Ingestion Stream
              </span>
            </div>
            <span className="text-2xs text-slate-500">Auto-refresh (1s poll)</span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-72">
            <table className="w-full table-dense text-left">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Proto</th>
                  <th>Packets</th>
                  <th>Status</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {flowHistory.slice(0, 8).map((flow, idx) => (
                  <tr key={flow.timestamp + '-' + idx}>
                    <td className="text-slate-500 whitespace-nowrap">
                      {new Date(flow.timestamp * 1000).toLocaleTimeString()}
                    </td>
                    <td className="text-slate-300 whitespace-nowrap">
                      {flow.src_ip}:{flow.src_port || 0}
                    </td>
                    <td className="text-slate-300 whitespace-nowrap">
                      {flow.dst_ip}:{flow.dst_port || 0}
                    </td>
                    <td className="text-slate-400">{flow.protocol}</td>
                    <td className="text-slate-300">{Number(flow.packet_count).toLocaleString()}</td>
                    <td>
                      <StatusBadge type="prediction" value={flow.prediction} size="xs" />
                    </td>
                    <td className="font-bold">
                      <span className={flow.anomaly_score >= 0.65 ? 'text-rose-400' : 'text-slate-400'}>
                        {Number(flow.anomaly_score || 0).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}

                {flowHistory.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                      No flow events in memory buffer. Select an adapter or start the synthetic generator above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Alerts Feed */}
        <div className="lg:col-span-5 bg-soc-900 border border-soc-700 rounded-lg overflow-hidden flex flex-col">
          <div className="px-3.5 py-2.5 border-b border-soc-750 bg-soc-950 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Security Incident Queue
              </span>
            </div>
            <span className="text-2xs text-slate-500">{recentAlerts.length} Active</span>
          </div>

          <div className="p-2 space-y-2 overflow-y-auto max-h-72 flex-1">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-2.5 rounded bg-soc-950 border border-soc-750 hover:border-soc-600 transition text-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusBadge type="severity" value={alert.severity} size="xs" />
                    <span className="text-slate-200 font-semibold">{alert.title}</span>
                  </div>
                  <span className="text-slate-500">
                    {new Date(alert.timestamp * 1000).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-slate-400 flex items-center space-x-2 text-2xs">
                  <span>Target: <strong className="text-slate-300">{alert.dst_ip}:{alert.dst_port}</strong></span>
                  <span>•</span>
                  <span>Engine: <strong className="text-sky-300">{alert.model}</strong></span>
                </div>
              </div>
            ))}

            {recentAlerts.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-xs">
                Zero critical anomalies detected. Pipeline running within baseline bounds.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
