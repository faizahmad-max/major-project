/**
 * NetShield AI - Frontend API Service Client
 */

const BASE_URL = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // System Health
  getHealth: () => request('/health'),
  getDashboardSummary: () => request('/dashboard/summary'),

  // Traffic
  getTraffic: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/traffic${q ? `?${q}` : ''}`);
  },

  // Alerts
  getAlerts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/alerts${q ? `?${q}` : ''}`);
  },
  reviewAlert: (id, status) => request(`/alerts/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ status })
  }),

  // Models
  getModels: () => request('/models'),
  getPerformance: () => request('/models/performance'),
  selectModel: (name) => request('/models/select', {
    method: 'POST',
    body: JSON.stringify({ name })
  }),
  trainModels: () => request('/models/train', { method: 'POST' }),

  // Capture
  getInterfaces: () => request('/capture/interfaces'),
  startCapture: (interfaceName) => request('/capture/start', {
    method: 'POST',
    body: JSON.stringify({ interface_name: interfaceName })
  }),
  stopCapture: () => request('/capture/stop', { method: 'POST' }),
  getCaptureStatus: () => request('/capture/status'),

  // Simulation
  startSimulation: (scenario, speed) => request('/simulation/start', {
    method: 'POST',
    body: JSON.stringify({ scenario, speed })
  }),
  stopSimulation: () => request('/simulation/stop', { method: 'POST' }),
  getSimulationStatus: () => request('/simulation/status'),

  // Lab Detection
  analyzeFlow: (flowData, compare = false) => request('/detection/analyze', {
    method: 'POST',
    body: JSON.stringify({ ...flowData, compare })
  }),

  // Reports & Audit
  getReportsSummary: () => request('/reports/summary'),
  getAuditLogs: (limit = 50) => request(`/reports/audit?limit=${limit}`),
  getExportUrl: (type = 'alerts', format = 'csv') => `${BASE_URL}/reports/export?type=${type}&format=${format}`
};

