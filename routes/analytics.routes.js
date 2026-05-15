const express = require('express');
const router = express.Router();
const analytics = require('../services/analytics.service');
const { authenticate } = require('../utils/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

router.post('/event', authenticate, asyncHandler(async (req, res) => {
  const { event_type, data } = req.body;
  await analytics.saveEvent(event_type, req.user.id, data);
  res.status(201).json({ message: 'Evento registrado' });
}));

module.exports = router;
