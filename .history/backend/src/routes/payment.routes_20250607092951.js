const express = require('express');
const router = express.Router();
const testController = require('../controllers/test_controller');

// Test route
router.get('/test', (req, res) => {
  testController.testEndpoint(req, res);
});

module.exports = router; 