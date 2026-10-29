/**
 * NetShield AI - ML Service HTTP Client
 * Dispatches requests to the FastAPI ML engine.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

async function fetchJson(url, options = {}) {
  const timeoutMs = options.timeout || 15000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    clearTimeout(id);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

class MLClient {
  static async checkHealth() {
    try {
      return await fetchJson(`${ML_SERVICE_URL}/health`, { timeout: 2000 });
    } catch (err) {
      return { status: 'down', error: err.message };
    }
  }

  static async getModels() {
    return await fetchJson(`${ML_SERVICE_URL}/models`);
  }

  static async selectModel(name) {
    return await fetchJson(`${ML_SERVICE_URL}/models/select`, {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }

  static async getPerformance() {
    return await fetchJson(`${ML_SERVICE_URL}/models/performance`);
  }

  static async triggerTraining() {
    return await fetchJson(`${ML_SERVICE_URL}/models/train`, { method: 'POST' });
  }

  static async predict(flowData) {
    return await fetchJson(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      body: JSON.stringify(flowData)
    });
  }

  static async compareModels(flowData) {
    return await fetchJson(`${ML_SERVICE_URL}/predict/compare`, {
      method: 'POST',
      body: JSON.stringify(flowData)
    });
  }

  static async getInterfaces() {
    return await fetchJson(`${ML_SERVICE_URL}/capture/interfaces`);
  }

  static async startCapture(interfaceName) {
    return await fetchJson(`${ML_SERVICE_URL}/capture/start`, {
      method: 'POST',
      body: JSON.stringify({ interface_name: interfaceName })
    });
  }

  static async stopCapture() {
    return await fetchJson(`${ML_SERVICE_URL}/capture/stop`, { method: 'POST' });
  }

  static async getCaptureStatus() {
    return await fetchJson(`${ML_SERVICE_URL}/capture/status`);
  }

  static async startSimulation(scenario, speed) {
    return await fetchJson(`${ML_SERVICE_URL}/simulation/start`, {
      method: 'POST',
      body: JSON.stringify({ scenario, speed })
    });
  }

  static async stopSimulation() {
    return await fetchJson(`${ML_SERVICE_URL}/simulation/stop`, { method: 'POST' });
  }

  static async getSimulationStatus() {
    return await fetchJson(`${ML_SERVICE_URL}/simulation/status`);
  }

  static async getTrafficStream(limit = 50) {
    return await fetchJson(`${ML_SERVICE_URL}/traffic/stream?limit=${limit}`);
  }
}

module.exports = MLClient;
