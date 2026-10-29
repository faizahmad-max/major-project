const express = require('express');
const router = express.Router();
const MLClient = require('../services/mlClient');
const AuditService = require('../services/auditService');

router.get('/interfaces', async (req, res, next) => {
  try {
    const data = await MLClient.getInterfaces();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/start', async (req, res, next) => {
  const { interface_name } = req.body;
  try {
    const data = await MLClient.startCapture(interface_name);
    AuditService.log('CAPTURE_STARTED', `Interface: ${interface_name || 'default'}`, 'USER');
    req.app.get('io').emit('capture:status', data);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/stop', async (req, res, next) => {
  try {
    const data = await MLClient.stopCapture();
    AuditService.log('CAPTURE_STOPPED', 'Live capture stopped', 'USER');
    req.app.get('io').emit('capture:status', data);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/status', async (req, res, next) => {
  try {
    const data = await MLClient.getCaptureStatus();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

