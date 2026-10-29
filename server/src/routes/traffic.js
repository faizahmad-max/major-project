const express = require('express');
const router = express.Router();
const trafficBuffer = require('../services/trafficBuffer');

router.get('/', (req, res) => {
  const { limit = 50, offset = 0, protocol, prediction, search } = req.query;
  const flows = trafficBuffer.getFlows({ limit, offset, protocol, prediction, search });
  res.json({
    flows,
    count: flows.length,
    offset: Number(offset),
    limit: Number(limit)
  });
});

module.exports = router;

