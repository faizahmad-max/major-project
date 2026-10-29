const express = require('express');
const router = express.Router();
const AlertService = require('../services/alertService');
const AuditService = require('../services/auditService');

router.get('/', (req, res) => {
  const { limit = 100, severity, status } = req.query;
  const alerts = AlertService.getAlerts({ limit, severity, status });
  res.json({ alerts, count: alerts.length });
});

router.post('/:id/review', (req, res) => {
  const { id } = req.params;
  const { status = 'REVIEWED' } = req.body;
  try {
    const updated = AlertService.updateAlertStatus(id, status);
    AuditService.log('ALERT_REVIEWED', `Alert #${id} marked as ${status}`, 'USER');
    res.json({ message: 'Alert updated', alert: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

