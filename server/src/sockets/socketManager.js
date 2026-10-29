/**
 * NetShield AI - Socket.IO Real-Time Dispatcher
 * Coordinates live telemetry, alert feeds, and connection health.
 */

const trafficBuffer = require('../services/trafficBuffer');
const MLClient = require('../services/mlClient');

function initSocketManager(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Send initial snapshot immediately
    socket.emit('dashboard:summary', trafficBuffer.getSummary());

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  // Telemetry loop: emit aggregated dashboard summary every 1 second
  setInterval(async () => {
    const summary = trafficBuffer.getSummary();
    io.emit('dashboard:summary', summary);
  }, 1000);

  // Status loop: sync capture and simulation status every 3 seconds
  setInterval(async () => {
    try {
      const [mlHealth, capStatus, simStatus] = await Promise.all([
        MLClient.checkHealth().catch(() => ({ status: 'down' })),
        MLClient.getCaptureStatus().catch(() => ({ is_capturing: false })),
        MLClient.getSimulationStatus().catch(() => ({ is_running: false }))
      ]);

      io.emit('system:status', {
        ml_service: mlHealth.status === 'healthy' ? 'UP' : 'DOWN',
        active_model: mlHealth.active_model || 'Unknown',
        capture: capStatus,
        simulation: simStatus,
        timestamp: Date.now() / 1000
      });
    } catch (_) {}
  }, 3000);
}

module.exports = { initSocketManager };

