import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Activity,
  Cpu,
  Sliders
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

const SAMPLE_PRESETS = {
  benign_web: {
    name: 'Normal Web Traffic (HTTPS/443)',
    desc: 'Standard TLS session, balanced SYN-ACK ratio, typical payload MTU.',
    flow: {
      src_ip: '192.168.1.105',
      dst_ip: '142.250.190.46',
      src_port: 52140,
      dst_port: 443,
      protocol: 'TCP',
      duration: 1.85,
      packet_count: 24,
      byte_count: 8200,
      packet_rate: 13.0,
      byte_rate: 4432.0,
      syn_count: 1,
      ack_count: 23,
      fin_count: 1,
      rst_count: 0,
      psh_count: 6,
      conn_frequency: 1.5
    }
  },
  dos_syn: {
    name: 'SYN Flood Exhaustion (DoS)',
    desc: 'High packet rate spike targeting port 80 with 0 ACK acknowledgements.',
    flow: {
      src_ip: '172.16.88.12',
      dst_ip: '10.0.0.5',
      src_port: 49152,
      dst_port: 80,
      protocol: 'TCP',
      duration: 0.05,
      packet_count: 850,
      byte_count: 51000,
      packet_rate: 17000.0,
      byte_rate: 1020000.0,
      syn_count: 850,
      ack_count: 0,
      fin_count: 0,
      rst_count: 0,
      psh_count: 0,
      conn_frequency: 380.0
    }
  },
  port_scan: {
    name: 'Sequential Port Discovery',
    desc: 'Rapid low-packet probes traversing non-standard destination ports.',
    flow: {
      src_ip: '192.168.1.150',
      dst_ip: '10.0.0.5',
      src_port: 55432,
      dst_port: 3389,
      protocol: 'TCP',
      duration: 0.005,
      packet_count: 1,
      byte_count: 48,
      packet_rate: 200.0,
      byte_rate: 9600.0,
      syn_count: 1,
      ack_count: 0,
      fin_count: 0,
      rst_count: 0,
      psh_count: 0,
      conn_frequency: 120.0
    }
  },
  brute_force: {
    name: 'SSH Auth Brute Force',
    desc: 'Repeated authentication attempt sequence on port 22 with medium packet sizes.',
    flow: {
      src_ip: '198.51.100.42',
      dst_ip: '10.0.0.5',
      src_port: 48210,
      dst_port: 22,
      protocol: 'TCP',
      duration: 2.4,
      packet_count: 65,
      byte_count: 9800,
      packet_rate: 27.0,
      byte_rate: 4083.0,
      syn_count: 1,
      ack_count: 62,
      fin_count: 1,
      rst_count: 1,
      psh_count: 18,
      conn_frequency: 35.0
    }
  },
  exfiltration: {
    name: 'Heavy Asymmetric Outbound Exfil',
    desc: 'Unusual long-duration transfer with high PSH flags to external socket.',
    flow: {
      src_ip: '10.0.0.12',
      dst_ip: '203.0.113.89',
      src_port: 51200,
      dst_port: 9001,
      protocol: 'TCP',
      duration: 15.2,
      packet_count: 3200,
      byte_count: 4608000,
      packet_rate: 210.5,
      byte_rate: 303157.0,
      syn_count: 1,
      ack_count: 3199,
      fin_count: 1,
      rst_count: 0,
      psh_count: 2200,
      conn_frequency: 2.0
    }
  }
};

export function AnomalyLab() {
  const [selectedPreset, setSelectedPreset] = useState('dos_syn');
  const [flowParams, setFlowParams] = useState(SAMPLE_PRESETS.dos_syn.flow);
  const [selectedModel, setSelectedModel] = useState('Random Forest');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePresetSelect = (key) => {
    setSelectedPreset(key);
    setFlowParams(SAMPLE_PRESETS[key].flow);
    setAnalysisResult(null);
    setComparisonResults(null);
  };

  const handleParamChange = (field, val) => {
    setFlowParams((prev) => ({
      ...prev,
      [field]: ['duration', 'packet_rate', 'byte_rate', 'conn_frequency'].includes(field)
        ? parseFloat(val) || 0
        : (['src_port', 'dst_port', 'packet_count', 'byte_count', 'syn_count', 'ack_count', 'fin_count', 'rst_count', 'psh_count'].includes(field)
          ? parseInt(val, 10) || 0
          : val)
    }));
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    setComparisonResults(null);
    try {
      const res = await api.analyzeFlow({
        ...flowParams,
        model_name: selectedModel
      });
      setAnalysisResult(res);
    } catch (err) {
      alert(`Analysis error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCompareAll = async () => {
    setLoading(true);
    setAnalysisResult(null);
    try {
      const res = await api.analyzeFlow(flowParams, true);
      setComparisonResults(res.comparison);
    } catch (err) {
      alert(`Comparison error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Header */}
      <div className="bg-soc-900 border border-soc-700 rounded-lg p-3.5">
        <div className="flex items-center space-x-2">
          <FlaskConical className="w-4 h-4 text-sky-400" />
          <span className="text-sm font-bold uppercase tracking-wider text-white">
            Anomaly Detection & Feature Attribution Workbench
          </span>
        </div>
        <p className="text-2xs text-slate-400 mt-0.5">
          Execute isolated inference testing across 4 algorithms simultaneously or tune individual flow vector dimensions.
        </p>
      </div>

      {/* Preset Vectors Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Object.entries(SAMPLE_PRESETS).map(([key, item]) => (
          <button
            key={key}
            onClick={() => handlePresetSelect(key)}
            className={`p-2.5 rounded border text-left transition text-2xs ${
              selectedPreset === key
                ? 'bg-soc-800 border-sky-500 shadow-sm'
                : 'bg-soc-900 border-soc-700 hover:border-soc-600 text-slate-400'
            }`}
          >
            <p className={`font-semibold ${selectedPreset === key ? 'text-white' : 'text-slate-300'}`}>
              {item.name}
            </p>
            <p className="text-slate-500 line-clamp-1 mt-0.5">{item.desc}</p>
          </button>
        ))}
      </div>

      {/* Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: Vector Editor */}
        <div className="lg:col-span-7 bg-soc-900 border border-soc-700 rounded-lg p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-soc-750 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Flow Vector Parameters
            </span>
            <span className="text-2xs text-slate-500">Preset: {SAMPLE_PRESETS[selectedPreset]?.name}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-2xs">
            <div>
              <label className="text-slate-500 block mb-0.5 uppercase">Source IP</label>
              <input
                type="text"
                value={flowParams.src_ip}
                onChange={(e) => handleParamChange('src_ip', e.target.value)}
                className="w-full bg-soc-950 border border-soc-750 rounded p-1.5 text-slate-200 focus:outline-none focus:border-soc-600 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-0.5 uppercase">Dest IP</label>
              <input
                type="text"
                value={flowParams.dst_ip}
                onChange={(e) => handleParamChange('dst_ip', e.target.value)}
                className="w-full bg-soc-950 border border-soc-750 rounded p-1.5 text-slate-200 focus:outline-none focus:border-soc-600 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-0.5 uppercase">Protocol</label>
              <select
                value={flowParams.protocol}
                onChange={(e) => handleParamChange('protocol', e.target.value)}
                className="w-full bg-soc-950 border border-soc-750 rounded p-1.5 text-slate-200 focus:outline-none focus:border-soc-600 font-mono"
              >
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
              </select>
            </div>
            <div>
              <label className="text-slate-500 block mb-0.5 uppercase">Source Port</label>
              <input
                type="number"
                value={flowParams.src_port}
                onChange={(e) => handleParamChange('src_port', e.target.value)}
                className="w-full bg-soc-950 border border-soc-750 rounded p-1.5 text-slate-200 focus:outline-none focus:border-soc-600 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-0.5 uppercase">Dest Port</label>
              <input
                type="number"
                value={flowParams.dst_port}
                onChange={(e) => handleParamChange('dst_port', e.target.value)}
                className="w-full bg-soc-950 border border-soc-750 rounded p-1.5 text-slate-200 focus:outline-none focus:border-soc-600 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-0.5 uppercase">Duration (s)</label>
              <input
                type="number"
                step="0.01"
                value={flowParams.duration}
                onChange={(e) => handleParamChange('duration', e.target.value)}
                className="w-full bg-soc-950 border border-soc-750 rounded p-1.5 text-slate-200 focus:outline-none focus:border-soc-600 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-0.5 uppercase">Packet Count</label>
              <input
                type="number"
                value={flowParams.packet_count}
                onChange={(e) => handleParamChange('packet_count', e.target.value)}
                className="w-full bg-soc-950 border border-soc-750 rounded p-1.5 text-slate-200 focus:outline-none focus:border-soc-600 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-0.5 uppercase">Total Bytes</label>
              <input
                type="number"
                value={flowParams.byte_count}
                onChange={(e) => handleParamChange('byte_count', e.target.value)}
                className="w-full bg-soc-950 border border-soc-750 rounded p-1.5 text-slate-200 focus:outline-none focus:border-soc-600 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-0.5 uppercase">SYN Flags</label>
              <input
                type="number"
                value={flowParams.syn_count}
                onChange={(e) => handleParamChange('syn_count', e.target.value)}
                className="w-full bg-soc-950 border border-soc-750 rounded p-1.5 text-slate-200 focus:outline-none focus:border-soc-600 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-0.5 uppercase">ACK Flags</label>
              <input
                type="number"
                value={flowParams.ack_count}
                onChange={(e) => handleParamChange('ack_count', e.target.value)}
                className="w-full bg-soc-950 border border-soc-750 rounded p-1.5 text-slate-200 focus:outline-none focus:border-soc-600 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-0.5 uppercase">PSH Flags</label>
              <input
                type="number"
                value={flowParams.psh_count}
                onChange={(e) => handleParamChange('psh_count', e.target.value)}
                className="w-full bg-soc-950 border border-soc-750 rounded p-1.5 text-slate-200 focus:outline-none focus:border-soc-600 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-0.5 uppercase">Frequency</label>
              <input
                type="number"
                step="0.5"
                value={flowParams.conn_frequency}
                onChange={(e) => handleParamChange('conn_frequency', e.target.value)}
                className="w-full bg-soc-950 border border-soc-750 rounded p-1.5 text-slate-200 focus:outline-none focus:border-soc-600 font-mono"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-soc-750 text-2xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Target Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-soc-950 border border-soc-750 rounded px-2 py-1 text-slate-200 focus:outline-none font-mono"
              >
                <option value="Random Forest">Random Forest (Supervised)</option>
                <option value="Isolation Forest">Isolation Forest (Unsupervised)</option>
                <option value="XGBoost">XGBoost (Boosted Trees)</option>
                <option value="Autoencoder">PyTorch Autoencoder (Reconstruction)</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleRunAnalysis}
                disabled={loading}
                className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold transition disabled:opacity-50"
              >
                {loading ? 'Evaluating...' : 'Run Selected'}
              </button>

              <button
                onClick={handleCompareAll}
                disabled={loading}
                className="px-3 py-1 rounded bg-soc-800 hover:bg-soc-750 text-slate-200 border border-soc-700 font-semibold transition disabled:opacity-50"
              >
                Compare All 4 Models
              </button>
            </div>
          </div>
        </div>

        {/* Right: Results Deck */}
        <div className="lg:col-span-5 bg-soc-900 border border-soc-700 rounded-lg p-3.5 space-y-3">
          <div className="border-b border-soc-750 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Inference Diagnostics
            </span>
          </div>

          {/* Single Analysis View */}
          {analysisResult && (
            <div className="space-y-2.5 text-2xs animate-fadeIn">
              <div className="p-3 rounded bg-soc-950 border border-soc-750 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase">Model:</span>
                  <span className="font-bold text-white">{analysisResult.model}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase">Classification:</span>
                  <StatusBadge type="prediction" value={analysisResult.prediction} size="xs" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase">Anomaly Score:</span>
                  <span className="font-bold text-sky-400 text-sm">
                    {Number(analysisResult.anomaly_score).toFixed(3)}
                  </span>
                </div>
                {analysisResult.attack_type && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase">Attack Class:</span>
                    <span className="font-bold text-rose-400">{analysisResult.attack_type}</span>
                  </div>
                )}
                {analysisResult.confidence && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase">Confidence:</span>
                    <span className="text-emerald-400 font-semibold">{(analysisResult.confidence * 100).toFixed(1)}%</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-soc-750">
                  <span>Latency:</span>
                  <span>{analysisResult.inference_latency_ms} ms</span>
                </div>
              </div>

              {analysisResult.explanation && analysisResult.explanation.length > 0 && (
                <div className="p-2.5 rounded bg-soc-950 border border-soc-750 space-y-1">
                  <span className="text-sky-400 font-semibold uppercase block">Observable Attribution:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                    {analysisResult.explanation.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisResult.class_probabilities && (
                <div className="p-2.5 rounded bg-soc-950 border border-soc-750 space-y-1.5">
                  <span className="text-slate-400 uppercase font-semibold block">Class Probabilities:</span>
                  {Object.entries(analysisResult.class_probabilities).map(([cls, prob]) => (
                    <div key={cls} className="space-y-0.5">
                      <div className="flex justify-between text-2xs">
                        <span className={cls === 'BENIGN' ? 'text-emerald-400' : 'text-slate-300'}>{cls}</span>
                        <span className="text-slate-400 font-mono">{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-soc-900 h-1 rounded overflow-hidden">
                        <div
                          className={`h-full ${cls === 'BENIGN' ? 'bg-emerald-500' : 'bg-sky-500'}`}
                          style={{ width: `${Math.round(prob * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Multi-Model Comparison Table */}
          {comparisonResults && (
            <div className="space-y-2 text-2xs animate-fadeIn">
              <span className="text-slate-400 uppercase font-semibold block">Multi-Model Decision Matrix:</span>
              <div className="space-y-1.5">
                {Object.entries(comparisonResults).map(([mName, res]) => (
                  <div key={mName} className="p-2.5 rounded bg-soc-950 border border-soc-750 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{mName}</span>
                      <StatusBadge type="prediction" value={res.prediction} size="xs" />
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Score: <strong className="text-slate-200">{Number(res.anomaly_score).toFixed(3)}</strong></span>
                      <span>Latency: <strong className="text-slate-200">{res.inference_latency_ms} ms</strong></span>
                    </div>
                    {res.attack_type && (
                      <div className="text-rose-400 font-semibold">Attribution: {res.attack_type}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!analysisResult && !comparisonResults && (
            <div className="py-16 text-center text-slate-500 text-xs">
              Select or tune a vector on the left and execute evaluation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
