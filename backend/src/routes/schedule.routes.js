const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// Routes cho nhân viên
// Lấy danh sách lịch làm việc của bản thân
router.get('/my-schedule', authenticateToken, scheduleController.getMySchedules);

// Lấy lịch làm việc hôm nay
router.get('/my-schedule/today', authenticateToken, scheduleController.getTodaySchedule);

// Xác nhận lịch làm việc
router.put('/confirm/:id', authenticateToken, scheduleController.confirmSchedule);

// Routes cho admin
// Lấy danh sách lịch làm việc của tất cả nhân viên
router.get('/admin', authenticateToken, isAdmin, scheduleController.getAllSchedules);

// Tạo lịch làm việc mới
router.post('/admin/create', authenticateToken, isAdmin, scheduleController.createSchedule);

// Cập nhật lịch làm việc
router.put('/admin/:id', authenticateToken, isAdmin, scheduleController.updateSchedule);

// Xóa lịch làm việc
router.delete('/admin/:id', authenticateToken, isAdmin, scheduleController.deleteSchedule);

// Tạo lịch làm việc hàng loạt
router.post('/admin/batch', authenticateToken, isAdmin, scheduleController.createBatchSchedules);

// Tạo lịch làm việc theo mẫu
router.post('/admin/template', authenticateToken, isAdmin, scheduleController.createScheduleTemplate);

module.exports = router; 