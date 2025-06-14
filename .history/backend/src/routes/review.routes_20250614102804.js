const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');

// Lấy tất cả đánh giá
router.get('/', reviewController.getAllReviews);

// Get reviews for a specific menu item
router.get('/menu-item/:menuItemId', reviewController.getMenuItemReviews);

// Get review summary for a menu item
router.get('/summary/:menuItemId', reviewController.getReviewSummary);

// Add a new review
router.post('/', reviewController.createReview);

// Route lấy đánh giá theo bàn
router.get('/table/:tableId', reviewController.getReviewsByTable);

// Route lấy đánh giá theo đơn hàng
router.get('/order/:orderId', reviewController.getReviewsByOrder);

// Route lấy các món ăn được đánh giá cao nhất
router.get('/top-rated', reviewController.getTopRatedItems);

// Xóa đánh giá
router.delete('/:id', reviewController.deleteReview);

// Đồng bộ lại số lượng đánh giá và điểm trung bình
router.post('/sync-ratings', reviewController.syncMenuItemRatings);

module.exports = router; 