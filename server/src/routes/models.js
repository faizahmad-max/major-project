const express = require('express');
const router = express.Router();
const MLClient = require('../services/mlClient');
const AuditService = require('../services/auditService');
const rateLimiter = require('../middleware/rateLimiter');

router.get('/', async (req, res, next) => {
  try {
    const data = await MLClient.getModels();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/performance', async (req, res, next) => {
  try {
    const data = await MLClient.getPerformance();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/select', async (req, res, next) => {
  const { name } = req.body;
  try {
    const data = await MLClient.selectModel(name);
    AuditService.log('MODEL_SWITCHED', `Active model set to ${name}`, 'USER');
    req.app.get('io').emit('model:status', { active_model: name });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/train', rateLimiter({ windowMs: 30000, max: 2 }), async (req, res, next) => {
  try {
    const data = await MLClient.triggerTraining();
    AuditService.log('MODEL_TRAINING_TRIGGERED', 'Model retraining pipeline started', 'ADMIN');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

