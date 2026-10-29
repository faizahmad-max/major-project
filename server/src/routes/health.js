const express = require('express');
const router = express.Router();
const MLClient = require('../services/mlClient');

router.get('/', async (req, res) => {
  const mlHealth = await MLClient.checkHealth();
  res.json({
    status: 'healthy',
    backend: 'Node.js Express',
    ml_service: mlHealth,
    uptime_sec: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

