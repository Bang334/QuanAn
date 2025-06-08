const express = require('express');
const router = express.Router();

// Simple test route
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Test endpoint is working!' });
});

module.exports = router; 