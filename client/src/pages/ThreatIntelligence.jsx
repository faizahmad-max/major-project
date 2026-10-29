import React, { useState } from 'react';
import {
  Globe,
  AlertCircle,
  Key,
  Shield,
  Search,
  Lock,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export function ThreatIntelligence() {
  const [testIp, setTestIp] = useState('185.220.101.5');
  const [lookupResult, setLookupResult] = useState(null);

  const handleLookup = () => {
    // Honest diagnostic indicator: Never fabricate external intelligence scores!
    setLookupResult({
      status: 'FEED_UNCONFIGURED',
      ip: testIp,
      message: 'External Threat Intelligence feed integration is currently UNCONFIGURED. No active API key registered.',
      details: 'In compliance with defensive cybersecurity engineering integrity standards, NetShield AI does not generate fabricated reputation percentages or synthetic threat scores.'
    });
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Header */}
      <div className="bg-soc-900 border border-soc-700 rounded-lg p-3.5">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-sky-400" />
          <span className="text-sm font-bold uppercase tracking-wider text-white">
            Threat Intelligence & OSINT Feeds
          </span>
        </div>
        <p className="text-2xs text-slate-400 mt-0.5">
          External reputation correlation, autonomous IP reputation lookups, and global threat pulse integration.
        </p>
      </div>

      {/* Integration Notice */}
      <div className="p-3 rounded bg-soc-900 border border-soc-700 text-2xs space-y-1">
        <div className="flex items-center space-x-1.5 text-amber-400 font-semibold uppercase">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Integration Status: UNCONFIGURED (Integrity Policy Enforced)</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          NetShield AI strictly reports actual live intelligence when valid provider credentials are configured. Fabricated reputation data is strictly prohibited in security operations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: Query Diagnostic Console */}
        <div className="lg:col-span-6 bg-soc-900 border border-soc-700 rounded-lg p-3.5 space-y-3 text-2xs">
          <div className="border-b border-soc-750 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live IP Reputation Query
            </span>
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={testIp}
              onChange={(e) => setTestIp(e.target.value)}
              placeholder="e.g. 198.51.100.42"
              className="w-full bg-soc-950 border border-soc-750 rounded p-1.5 text-slate-200 focus:outline-none focus:border-soc-600 font-mono text-2xs"
            />
            <button
              onClick={handleLookup}
              className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold transition"
            >
              Query
            </button>
          </div>

          {lookupResult && (
            <div className="p-3 rounded bg-soc-950 border border-soc-750 space-y-2 animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Target IP:</span>
                <span className="font-bold text-white">{lookupResult.ip}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status:</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                  {lookupResult.status}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-2xs">{lookupResult.message}</p>
              <p className="text-slate-500 text-2xs pt-1 border-t border-soc-750">{lookupResult.details}</p>
            </div>
          )}
        </div>

        {/* Right: Connectors Status */}
        <div className="lg:col-span-6 bg-soc-900 border border-soc-700 rounded-lg p-3.5 space-y-3 text-2xs">
          <div className="border-b border-soc-750 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Provider Connector Configuration
            </span>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded bg-soc-950 border border-soc-750 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">AbuseIPDB API v2</span>
                <span className="text-slate-500 text-2xs">Crowdsourced IP abuse confidence scoring</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-soc-900 text-slate-500 border border-soc-750 text-2xs">
                OFFLINE / NO KEY
              </span>
            </div>

            <div className="p-2.5 rounded bg-soc-950 border border-soc-750 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">VirusTotal API v3</span>
                <span className="text-slate-500 text-2xs">Multi-engine reputation & domain categorization</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-soc-900 text-slate-500 border border-soc-750 text-2xs">
                OFFLINE / NO KEY
              </span>
            </div>

            <div className="p-2.5 rounded bg-soc-950 border border-soc-750 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">AlienVault OTX Pulse</span>
                <span className="text-slate-500 text-2xs">Open Threat Exchange adversary indicator feeds</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-soc-900 text-slate-500 border border-soc-750 text-2xs">
                OFFLINE / NO KEY
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
