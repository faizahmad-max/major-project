import React, { useState, useEffect } from 'react';
import {
  Shield,
  Radio,
  Cpu,
  Activity,
  Play,
  Square,
  Server,
  User,
  Sliders,
  Bell
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from './StatusBadge';

export function Navbar({ systemStatus, isSocketConnected, unreviewedAlertCount = 0 }) {
  const [activeModel, setActiveModel] = useState('Random Forest');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('normal');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0] + ' UTC' + (now.getTimezoneOffset() > 0 ? '-' : '+') + Math.abs(now.getTimezoneOffset() / 60));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (systemStatus) {
      if (systemStatus.active_model) setActiveModel(systemStatus.active_model);
      if (systemStatus.simulation) setIsSimulating(systemStatus.simulation.is_running);
      if (systemStatus.capture) setIsCapturing(systemStatus.capture.is_capturing);
      if (systemStatus.simulation?.current_scenario) setSelectedScenario(systemStatus.simulation.current_scenario);
    }
  }, [systemStatus]);

  const handleToggleSimulation = async () => {
    try {
      if (isSimulating) {
        await api.stopSimulation();
        setIsSimulating(false);
      } else {
        await api.startSimulation(selectedScenario, 2.0);
        setIsSimulating(true);
        setIsCapturing(false);
      }
    } catch (err) {
      alert(`Simulation control error: ${err.message}`);
    }
  };

  const handleScenarioChange = async (e) => {
    const newScen = e.target.value;
    setSelectedScenario(newScen);
    if (isSimulating) {
      try {
        await api.startSimulation(newScen, 2.0);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const currentMode = isCapturing ? 'LIVE' : (isSimulating ? 'SIMULATED' : 'IDLE');

  return (
    <header className="sticky top-0 z-40 w-full bg-soc-950 border-b border-soc-700/80 px-4 py-2 text-xs font-mono">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand & Scope */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded bg-soc-900 border border-soc-700 text-sky-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold tracking-wider text-slate-100 text-sm">
                  NETSHIELD<span className="text-sky-400 font-semibold">.AI</span>
                </span>
                <span className="text-2xs font-mono px-1 py-0.2 rounded bg-soc-800 text-slate-400 border border-soc-700">
                  v4.2-SOC
                </span>
              </div>
            </div>
          </div>

          <div className="hidden xl:flex items-center space-x-2 pl-3 border-l border-soc-700/80 text-2xs text-slate-400">
            <span className="text-slate-500">ENV:</span>
            <span className="text-slate-300 font-semibold bg-soc-900 px-1.5 py-0.5 rounded border border-soc-750">
              PROD-VPC-EAST
            </span>
            <span className="text-slate-500 ml-1">SENSOR:</span>
            <span className="text-slate-300 bg-soc-900 px-1.5 py-0.5 rounded border border-soc-750">
              ns-collector-01
            </span>
          </div>
        </div>

        {/* Center: Ingestion Strip & Mode Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Active Mode Pill */}
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-soc-900 border border-soc-750 text-2xs">
            <Radio className={`w-3.5 h-3.5 ${isCapturing ? 'text-emerald-400 animate-pulse' : (isSimulating ? 'text-sky-400' : 'text-slate-500')}`} />
            <span className="text-slate-400 uppercase">Telemetry:</span>
            <StatusBadge type="mode" value={currentMode} size="xs" />
          </div>

          {/* Scenario Generator Switcher */}
          <div className="hidden md:flex items-center space-x-1.5 px-2 py-1 rounded bg-soc-900 border border-soc-750 text-2xs">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedScenario}
              onChange={handleScenarioChange}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-2xs font-mono"
            >
              <option value="normal" className="bg-soc-900 text-white">Scenario: Normal Baseline</option>
              <option value="syn_flood" className="bg-soc-900 text-white">Scenario: Volumetric DoS Flood</option>
              <option value="port_scan" className="bg-soc-900 text-white">Scenario: Port Scan Sweep</option>
              <option value="brute_force" className="bg-soc-900 text-white">Scenario: SSH/RDP Brute Force</option>
              <option value="data_exfiltration" className="bg-soc-900 text-white">Scenario: Heavy Exfiltration</option>
              <option value="mixed" className="bg-soc-900 text-white">Scenario: Mixed Organic Traffic</option>
            </select>

            <button
              onClick={handleToggleSimulation}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-2xs font-semibold transition ${
                isSimulating
                  ? 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                  : 'bg-soc-800 text-sky-300 border border-soc-600 hover:bg-soc-750'
              }`}
            >
              {isSimulating ? (
                <>
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>Halt</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Inject</span>
                </>
              )}
            </button>
          </div>

          {/* Model Status Pill */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-soc-900 border border-soc-750 text-2xs">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">ENGINE:</span>
            <span className="text-sky-300 font-semibold">{activeModel}</span>
          </div>
        </div>

        {/* Right: Clock & Operational Diagnostics */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="hidden sm:flex items-center space-x-2 text-2xs text-slate-400 bg-soc-900 px-2.5 py-1 rounded border border-soc-750">
            <span className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span>SOCKET: {isSocketConnected ? 'SYNCED' : 'DISCONNECTED'}</span>
          </div>

          <div className="hidden md:block text-2xs text-slate-400 px-2 py-1 bg-soc-900 rounded border border-soc-750">
            {currentTime}
          </div>

          {/* Analyst profile */}
          <div className="flex items-center space-x-1.5 px-2 py-1 bg-soc-900 rounded border border-soc-750 text-2xs text-slate-300">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline font-semibold">secops.admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
