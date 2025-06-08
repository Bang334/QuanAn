const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

// Public routes
router.get('/active', promotionController.getActivePromotions);
router.get('/:id', promotionController.getPromotionById);

// Admin routes
router.get('/admin', authenticateToken, isAdmin, promotionController.getAllPromotions);
router.post('/', authenticateToken, isAdmin, promotionController.createPromotion);
router.put('/:id', authenticateToken, isAdmin, promotionController.updatePromotion);
router.delete('/:id', authenticateToken, isAdmin, promotionController.deletePromotion);

// Order promotion routes
router.post('/apply', authenticateToken, promotionController.applyPromotionToOrder);
router.get('/order/:orderId', authenticateToken, promotionController.getPromotionsByOrder);
router.delete('/order/:orderId/promotion/:promotionId', authenticateToken, promotionController.removePromotionFromOrder);

module.exports = router; 