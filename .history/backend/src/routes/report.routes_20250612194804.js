const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Áp dụng middleware xác thực cho tất cả các route
router.use(authMiddleware.verifyToken);

// Lấy báo cáo doanh thu
router.get('/revenue', roleMiddleware.isManagerOrAdmin, reportController.getRevenueReport);

module.exports = router; 