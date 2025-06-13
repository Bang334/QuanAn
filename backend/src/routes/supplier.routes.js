const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Áp dụng middleware xác thực cho tất cả các route
router.use(authMiddleware.verifyToken);

// Lấy danh sách nhà cung cấp
router.get('/', supplierController.getAllSuppliers);

// Lấy danh sách nhà cung cấp đang hoạt động
router.get('/active', supplierController.getActiveSuppliers);

// Lấy chi tiết nhà cung cấp
router.get('/:id', supplierController.getSupplierById);

// Tạo nhà cung cấp mới
router.post('/', roleMiddleware.isKitchenManager, supplierController.createSupplier);

// Cập nhật nhà cung cấp
router.put('/:id', roleMiddleware.isKitchenManager, supplierController.updateSupplier);

// Xóa nhà cung cấp
router.delete('/:id', roleMiddleware.isKitchenManager, supplierController.deleteSupplier);

// Lấy báo cáo hiệu suất nhà cung cấp
router.get('/reports/performance', roleMiddleware.isKitchenManager, supplierController.getSupplierPerformance);

module.exports = router; 