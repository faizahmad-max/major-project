import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LiveDashboard } from './pages/LiveDashboard';
import { PacketInspection } from './pages/PacketInspection';
import { AnomalyLab } from './pages/AnomalyLab';
import { AlertsCenter } from './pages/AlertsCenter';
import { ThreatIntelligence } from './pages/ThreatIntelligence';
import { ModelManagement } from './pages/ModelManagement';
import { ReportsAudit } from './pages/ReportsAudit';
import { useSocket } from './hooks/useSocket';

export default function App() {
  const {
    isConnected,
    summary,
    systemStatus,
    latestFlow,
    flowHistory,
    latestAlert
  } = useSocket();

  const unreviewedCount = summary?.recent_alerts?.filter(a => a.status === 'UNREVIEWED').length || 0;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-soc-950 text-slate-200 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
        {/* Top Operational Navbar */}
        <Navbar
          systemStatus={systemStatus}
          isSocketConnected={isConnected}
          unreviewedAlertCount={unreviewedCount}
        />

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          <Sidebar unreviewedAlertCount={unreviewedCount} />

          {/* Core Content Container */}
          <main className="flex-1 p-3.5 md:p-4 overflow-y-auto max-w-[1700px] w-full">
            <Routes>
              <Route
                path="/"
                element={
                  <LiveDashboard
                    summary={summary}
                    systemStatus={systemStatus}
                    flowHistory={flowHistory}
                    latestAlert={latestAlert}
                  />
                }
              />
              <Route
                path="/inspection"
                element={<PacketInspection latestFlow={latestFlow} />}
              />
              <Route path="/lab" element={<AnomalyLab />} />
              <Route
                path="/alerts"
                element={<AlertsCenter latestAlert={latestAlert} />}
              />
              <Route path="/threat-intel" element={<ThreatIntelligence />} />
              <Route path="/models" element={<ModelManagement />} />
              <Route path="/reports" element={<ReportsAudit />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
