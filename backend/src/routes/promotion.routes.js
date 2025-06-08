const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// Admin routes
router.get('/admin', authenticateToken, isAdmin, promotionController.getAllPromotions);
router.post('/', authenticateToken, isAdmin, promotionController.createPromotion);

// Public routes
router.get('/active', promotionController.getActivePromotions);

// Order promotion routes
router.post('/apply', authenticateToken, promotionController.applyPromotionToOrder);
router.get('/order/:orderId', authenticateToken, promotionController.getPromotionsByOrder);
router.delete('/order/:orderId/promotion/:promotionId', authenticateToken, promotionController.removePromotionFromOrder);

// Routes with ID parameter - these should come after more specific routes
router.get('/:id', promotionController.getPromotionById);
router.put('/:id', authenticateToken, isAdmin, promotionController.updatePromotion);
router.delete('/:id', authenticateToken, isAdmin, promotionController.deletePromotion);

module.exports = router; 