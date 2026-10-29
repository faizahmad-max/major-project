const express = require('express');
const router = express.Router();
const MLClient = require('../services/mlClient');
const AuditService = require('../services/auditService');

router.post('/start', async (req, res, next) => {
  const { scenario = 'normal', speed = 2.0 } = req.body;
  try {
    const data = await MLClient.startSimulation(scenario, speed);
    AuditService.log('SIMULATION_STARTED', `Scenario: ${scenario}, Speed: ${speed} eps`, 'USER');
    req.app.get('io').emit('simulation:status', data);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/stop', async (req, res, next) => {
  try {
    const data = await MLClient.stopSimulation();
    AuditService.log('SIMULATION_STOPPED', 'Simulation engine stopped', 'USER');
    req.app.get('io').emit('simulation:status', data);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/status', async (req, res, next) => {
  try {
    const data = await MLClient.getSimulationStatus();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

