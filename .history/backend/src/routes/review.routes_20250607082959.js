const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');

// Route lấy đánh giá cho một món ăn
router.get('/menuitem/:menuItemId', reviewController.getReviewsByMenuItem);

// Route lấy thông tin tổng hợp đánh giá cho một món ăn
router.get('/summary/:menuItemId', reviewController.getReviewSummary);

// Route tạo đánh giá mới
router.post('/', reviewController.createReview);

// Route lấy đánh giá theo bàn
router.get('/table/:tableId', reviewController.getReviewsByTable);

// Route lấy đánh giá theo đơn hàng
router.get('/order/:orderId', reviewController.getReviewsByOrder);

// Route lấy các món ăn được đánh giá cao nhất
router.get('/top-rated', reviewController.getTopRatedItems);

module.exports = router; 