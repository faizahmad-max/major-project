import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  Clock,
  Database,
  BarChart2,
  Zap,
  Sliders,
  Check
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { api } from '../services/api';

export function ModelManagement() {
  const [performance, setPerformance] = useState(null);
  const [activeModel, setActiveModel] = useState('Random Forest');
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const res = await api.getPerformance();
      setPerformance(res);
      if (res.active_model) setActiveModel(res.active_model);
    } catch (err) {
      console.error('Fetch performance error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const handleSelectModel = async (name) => {
    try {
      await api.selectModel(name);
      setActiveModel(name);
      fetchPerformance();
    } catch (err) {
      alert(`Model selection failed: ${err.message}`);
    }
  };

  const handleRetrain = async () => {
    if (!window.confirm('Trigger automated model training across all 4 IDS algorithms?')) return;
    setTraining(true);
    try {
      await api.trainModels();
      alert('Model retraining pipeline initiated. Re-evaluating test splits and computing metrics...');
      setTimeout(() => {
        fetchPerformance();
        setTraining(false);
      }, 5000);
    } catch (err) {
      alert(`Retraining error: ${err.message}`);
      setTraining(false);
    }
  };

  const availableModels = performance?.available_models || [];
  const latestEval = performance?.latest || {};
  const modelsMetrics = latestEval?.models || {};

  const comparisonData = availableModels.map((m) => {
    const met = modelsMetrics[m.name] || m.metrics || {};
    return {
      name: m.name.replace('Forest', 'F.').replace('Intrusion', ''),
      F1: Math.round(((met.test_f1 || met.f1_score || 0)) * 100),
      Precision: Math.round(((met.test_precision || met.precision || 0)) * 100),
      Recall: Math.round(((met.test_recall || met.recall || 0)) * 100),
      Latency: met.avg_latency_ms || 0.1
    };
  });

  return (
    <div className="space-y-3 font-mono">
      {/* Header */}
      <div className="bg-soc-900 border border-soc-700 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-bold uppercase tracking-wider text-white">
              Model Registry & MLOps Orchestration
            </span>
            <span className="text-2xs px-1.5 py-0.2 rounded bg-soc-800 text-slate-400 border border-soc-700">
              4 PRODUCTION ENGINES
            </span>
          </div>
          <p className="text-2xs text-slate-400 mt-0.5">
            Validation benchmarks, zero-leakage test splits, inference latency budgets, and real-time engine hot-swapping.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-2xs">
          <button
            onClick={handleRetrain}
            disabled={training}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${training ? 'animate-spin' : ''}`} />
            <span>{training ? 'Training Pipeline...' : 'Retrain All Models'}</span>
          </button>
        </div>
      </div>

      {/* Dataset Provenance Strip */}
      <div className="p-3 rounded bg-soc-900 border border-soc-700 text-2xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Database className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span><strong>Baseline Benchmark:</strong> Curated Demonstration IDS Dataset (CIC-IDS2017/UNSW-NB15 Schema)</span>
        </div>
        <div className="text-slate-500 text-2xs">
          Split: <strong className="text-slate-300">80% Train (3,200) / 20% Unseen Test (800)</strong>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {availableModels.map((m) => {
          const isActive = m.name === activeModel;
          const met = modelsMetrics[m.name] || m.metrics || {};
          const f1Val = met.test_f1 || met.f1_score;
          const precVal = met.test_precision || met.precision;
          const recVal = met.test_recall || met.recall;
          const fprVal = met.test_fpr || met.false_positive_rate;
          const latency = met.avg_latency_ms;

          return (
            <div
              key={m.name}
              className={`p-3.5 rounded border flex flex-col justify-between transition text-2xs ${
                isActive
                  ? 'bg-soc-800 border-sky-500 shadow-sm'
                  : 'bg-soc-900 border-soc-700 hover:border-soc-600'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase text-2xs font-semibold">
                    {m.model_type}
                  </span>
                  {isActive && (
                    <span className="px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800 text-2xs font-bold">
                      ACTIVE ENGINE
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white">{m.name}</h3>

                <div className="space-y-1 pt-2 border-t border-soc-750 text-2xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">F1 Score:</span>
                    <span className="font-bold text-white">
                      {f1Val !== undefined ? (f1Val * 100).toFixed(1) + '%' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Precision:</span>
                    <span className="text-sky-300 font-semibold">
                      {precVal !== undefined ? (precVal * 100).toFixed(1) + '%' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recall:</span>
                    <span className="text-emerald-400 font-semibold">
                      {recVal !== undefined ? (recVal * 100).toFixed(1) + '%' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">False Positive:</span>
                    <span className="text-amber-300">
                      {fprVal !== undefined ? (fprVal * 100).toFixed(2) + '%' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-soc-750/60 text-slate-500 text-2xs">
                    <span>Latency:</span>
                    <span>{latency ? `${latency} ms` : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-soc-750">
                {isActive ? (
                  <div className="w-full py-1 text-center text-2xs font-semibold text-sky-400 flex items-center justify-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Serving Ingest Stream</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectModel(m.name)}
                    className="w-full py-1 rounded bg-soc-950 hover:bg-soc-750 border border-soc-750 text-slate-300 text-2xs font-semibold transition"
                  >
                    Promote to Active
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Model Benchmark Performance Comparison Chart */}
      <div className="bg-soc-900 border border-soc-700 rounded-lg p-3.5">
        <div className="border-b border-soc-750 pb-2 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Model Validation Benchmark Comparison
          </h3>
          <p className="text-2xs text-slate-400">Measured Precision, Recall, and F1 on unseen 20% test partition</p>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#1f283c" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="#475569" tick={{ fontSize: 9, fontFamily: 'monospace' }} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0d111a', borderColor: '#28344d', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }} />
              <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <Bar dataKey="F1" fill="#0284c7" radius={[2, 2, 0, 0]} name="F1 (%)" />
              <Bar dataKey="Precision" fill="#38bdf8" radius={[2, 2, 0, 0]} name="Precision (%)" />
              <Bar dataKey="Recall" fill="#10b981" radius={[2, 2, 0, 0]} name="Recall (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
