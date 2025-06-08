const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Create a new payment (accessible by staff or admin)
router.post('/', verifyToken, paymentController.createPayment);

// Get all payments with pagination and filtering (admin only)
router.get('/', verifyToken, isAdmin, paymentController.getAllPayments);

// Get payment by ID
router.get('/:id', verifyToken, paymentController.getPaymentById);

// Update payment (admin only)
router.put('/:id', verifyToken, isAdmin, paymentController.updatePayment);

// Get revenue statistics (admin only)
router.get('/stats/revenue', verifyToken, isAdmin, paymentController.getRevenueStats);

// Get category revenue statistics (admin only)
router.get('/stats/category', verifyToken, isAdmin, paymentController.getCategoryRevenue);

// Get top selling items (admin only)
router.get('/stats/top-items', verifyToken, isAdmin, paymentController.getTopSellingItems);

module.exports = router; 