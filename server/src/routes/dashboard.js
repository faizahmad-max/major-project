const express = require('express');
const router = express.Router();
const trafficBuffer = require('../services/trafficBuffer');
const AlertService = require('../services/alertService');

router.get('/summary', (req, res) => {
  const summary = trafficBuffer.getSummary();
  const recentAlerts = AlertService.getAlerts({ limit: 5 });
  res.json({
    ...summary,
    recent_alerts: recentAlerts
  });
});

module.exports = router;

