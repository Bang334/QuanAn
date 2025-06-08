const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/auth');
const paymentController = require('../controllers/payment.controller');
const testController = require('../controllers/test_controller');

// Create a new payment (accessible by staff or admin)
router.post('/', verifyToken, (req, res) => {
  paymentController.createPayment(req, res);
});

// Get all payments with pagination and filtering (admin only)
router.get('/', verifyToken, isAdmin, (req, res) => {
  paymentController.getAllPayments(req, res);
});

// Get revenue statistics (admin only)
router.get('/stats/revenue', verifyToken, isAdmin, (req, res) => {
  paymentController.getRevenueStats(req, res);
});

// Get category revenue statistics (admin only)
router.get('/stats/category', verifyToken, isAdmin, (req, res) => {
  paymentController.getCategoryRevenue(req, res);
});

// Get top selling items (admin only)
router.get('/stats/top-items', verifyToken, isAdmin, (req, res) => {
  paymentController.getTopSellingItems(req, res);
});

// Get payment by ID
router.get('/:id', verifyToken, (req, res) => {
  paymentController.getPaymentById(req, res);
});

// Update payment (admin only)
router.put('/:id', verifyToken, isAdmin, (req, res) => {
  paymentController.updatePayment(req, res);
});

// Test route
router.get('/test', (req, res) => {
  testController.testEndpoint(req, res);
});

module.exports = router; 