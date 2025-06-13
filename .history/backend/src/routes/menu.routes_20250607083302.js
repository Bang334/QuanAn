const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const upload = require('../middlewares/upload');

// Lấy tất cả các món ăn
router.get('/', menuController.getAllMenuItems);

// Lấy các món ăn phổ biến
router.get('/popular', menuController.getPopularItems);

// Lấy món ăn theo danh mục
router.get('/category/:category', menuController.getMenuItemsByCategory);

// Lấy món ăn theo ID
router.get('/:id', menuController.getMenuItemById);

// Thêm món ăn mới (yêu cầu quyền admin)
router.post('/', upload.single('image'), menuController.createMenuItem);

// Cập nhật món ăn (yêu cầu quyền admin)
router.put('/:id', upload.single('image'), menuController.updateMenuItem);

// Xóa món ăn (yêu cầu quyền admin)
router.delete('/:id', menuController.deleteMenuItem);

module.exports = router; 