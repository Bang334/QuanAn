const express = require('express');
const router = express.Router();
const salaryRateController = require('../controllers/salaryRate.controller');
const { authenticateToken, isAdmin, authorizeRoles } = require('../middlewares/auth');

// Lấy tất cả mức lương (cho phép admin, kitchen, waiter)
router.get('/', authenticateToken, authorizeRoles(['admin','kitchen','waiter']), salaryRateController.getAllSalaryRates);

// Lấy mức lương hiện tại cho một vị trí và ca làm việc
router.get('/current', authenticateToken, salaryRateController.getCurrentSalaryRate);

// Lấy mức lương theo ID
router.get('/:id', authenticateToken, isAdmin, salaryRateController.getSalaryRateById);

// Tạo mức lương mới (chỉ admin)
router.post('/', authenticateToken, isAdmin, salaryRateController.createSalaryRate);

// Cập nhật mức lương (chỉ admin)
router.put('/:id', authenticateToken, isAdmin, salaryRateController.updateSalaryRate);

// Xóa mức lương (chỉ admin)
router.delete('/:id', authenticateToken, isAdmin, salaryRateController.deleteSalaryRate);

module.exports = router; 