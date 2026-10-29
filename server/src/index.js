/**
 * NetShield AI - Main Node.js Express & Socket.IO Server
 */

const express = require('express');
const http = require('node:http');
const cors = require('cors');
const { Server } = require('socket.io');

const { initSocketManager } = require('./sockets/socketManager');
const trafficBuffer = require('./services/trafficBuffer');
const AlertService = require('./services/alertService');
const errorHandler = require('./middleware/errorHandler');

// Route modules
const path = require('node:path');
const healthRoutes = require('./routes/health');
const dashboardRoutes = require('./routes/dashboard');
const trafficRoutes = require('./routes/traffic');
const alertsRoutes = require('./routes/alerts');
const modelsRoutes = require('./routes/models');
const captureRoutes = require('./routes/capture');
const simulationRoutes = require('./routes/simulation');
const detectionRoutes = require('./routes/detection');
const reportsRoutes = require('./routes/reports');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);
initSocketManager(io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve built frontend assets if present
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/capture', captureRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/detection', detectionRoutes);
app.use('/api/reports', reportsRoutes);

// Internal webhook endpoint receiving analyzed flows from Python ML Service
app.post('/api/internal/flow', (req, res) => {
  const flow = req.body;
  if (!flow) {
    return res.status(400).json({ error: 'Missing flow payload' });
  }

  // 1. Buffer and persist flow
  trafficBuffer.addFlow(flow);

  // 2. Evaluate alert policy & emit alert/anomaly event
  AlertService.processFlow(flow, io);

  // 3. Emit real-time flow update to connected dashboards
  io.emit('traffic:update', flow);

  res.json({ success: true });
});

// Single Page Application client routing fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// Centralized error handler
app.use(errorHandler);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(` NetShield AI Backend Server`);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(` Socket.IO active`);
  console.log(` Database: SQLite Native Node.js Sync`);
  console.log(`====================================================`);
});

module.exports = { app, server };
