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

// Từ chối lịch làm việc
router.put('/reject/:id', authenticateToken, scheduleController.rejectSchedule);

// Đăng ký ca làm việc (chức năng mới cho nhân viên)
router.post('/register', authenticateToken, scheduleController.registerSchedule);

// Hủy đăng ký ca làm việc (chức năng mới cho nhân viên)
router.delete('/cancel/:id', authenticateToken, scheduleController.cancelSchedule);

// Lấy danh sách ca làm việc có sẵn cho nhân viên
router.get('/available-shifts', authenticateToken, scheduleController.getAvailableShifts);

// Lấy thông tin số lượng nhân viên đã được phân công cho từng ca
router.get('/shift-stats', authenticateToken, scheduleController.getShiftStats);

// Lấy tổng quan lịch làm việc theo tuần
router.get('/weekly-summary', authenticateToken, scheduleController.getWeeklyScheduleSummary);

// Routes cho admin
// Lấy danh sách lịch làm việc của tất cả nhân viên
router.get('/admin', authenticateToken, isAdmin, scheduleController.getAllSchedules);

// Lấy danh sách lịch làm việc của tất cả nhân viên (alias)
router.get('/admin/all', authenticateToken, isAdmin, scheduleController.getAllSchedules);

// Tạo lịch làm việc mới
router.post('/admin/create', authenticateToken, isAdmin, scheduleController.createSchedule);

// Cập nhật lịch làm việc
router.put('/admin/:id', authenticateToken, isAdmin, scheduleController.updateSchedule);

// Xóa lịch làm việc
router.delete('/admin/:id', authenticateToken, isAdmin, scheduleController.deleteSchedule);

// Tạo lịch làm việc hàng loạt
router.post('/admin/batch-create', authenticateToken, isAdmin, scheduleController.createBatchSchedules);

// Tạo lịch làm việc theo mẫu
router.post('/admin/template', authenticateToken, isAdmin, scheduleController.createScheduleTemplate);

// Lấy danh sách lịch làm việc do nhân viên tự đăng ký
router.get('/admin/staff-registrations', authenticateToken, isAdmin, scheduleController.getStaffRegisteredSchedules);

// Kiểm tra ràng buộc lịch làm việc
router.get('/check', authenticateToken, scheduleController.checkScheduleConstraints);

// Alias cho /my-schedule
router.get('/me', authenticateToken, scheduleController.getMySchedules);
router.put('/me/confirm/:id', authenticateToken, scheduleController.confirmSchedule);

module.exports = router; 