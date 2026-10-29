const express = require('express');
const router = express.Router();
const MLClient = require('../services/mlClient');

router.post('/analyze', async (req, res, next) => {
  const { compare = false, ...flowData } = req.body;
  try {
    if (compare) {
      const results = await MLClient.compareModels(flowData);
      return res.json({ comparison: results });
    }
    const result = await MLClient.predict(flowData);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

