const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Create a new promotion (admin only)
router.post('/', verifyToken, isAdmin, promotionController.createPromotion);

// Get all promotions with filtering (admin view)
router.get('/admin', verifyToken, isAdmin, promotionController.getAllPromotions);

// Get active promotions (public view for customers)
router.get('/active', promotionController.getActivePromotions);

// Apply promotion to order
router.post('/apply', verifyToken, promotionController.applyPromotionToOrder);

// Get promotions by order
router.get('/order/:orderId', verifyToken, promotionController.getPromotionsByOrder);

// Remove promotion from order
router.delete('/order/:orderId/promotion/:promotionId', verifyToken, promotionController.removePromotionFromOrder);

// Get promotion by ID
router.get('/:id', promotionController.getPromotionById);

// Update promotion (admin only)
router.put('/:id', verifyToken, isAdmin, promotionController.updatePromotion);

// Delete promotion (admin only)
router.delete('/:id', verifyToken, isAdmin, promotionController.deletePromotion);

module.exports = router; 