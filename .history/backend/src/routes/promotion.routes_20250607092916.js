const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/auth');
const promotionController = require('../controllers/promotion.controller');
const testController = require('../controllers/test_controller');

// Create a new promotion (admin only)
router.post('/', verifyToken, isAdmin, (req, res) => {
  promotionController.createPromotion(req, res);
});

// Get all promotions with filtering (admin view)
router.get('/admin', verifyToken, isAdmin, (req, res) => {
  promotionController.getAllPromotions(req, res);
});

// Get active promotions (public view for customers)
router.get('/active', (req, res) => {
  promotionController.getActivePromotions(req, res);
});

// Apply promotion to order
router.post('/apply', verifyToken, (req, res) => {
  promotionController.applyPromotionToOrder(req, res);
});

// Get promotions by order
router.get('/order/:orderId', verifyToken, (req, res) => {
  promotionController.getPromotionsByOrder(req, res);
});

// Remove promotion from order
router.delete('/order/:orderId/promotion/:promotionId', verifyToken, (req, res) => {
  promotionController.removePromotionFromOrder(req, res);
});

// Get promotion by ID
router.get('/:id', (req, res) => {
  promotionController.getPromotionById(req, res);
});

// Update promotion (admin only)
router.put('/:id', verifyToken, isAdmin, (req, res) => {
  promotionController.updatePromotion(req, res);
});

// Delete promotion (admin only)
router.delete('/:id', verifyToken, isAdmin, (req, res) => {
  promotionController.deletePromotion(req, res);
});

// Test route
router.get('/test', (req, res) => {
  testController.testEndpoint(req, res);
});

module.exports = router; 