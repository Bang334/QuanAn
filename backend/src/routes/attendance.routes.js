const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// Routes cho nhân viên
// Lấy danh sách chấm công của bản thân
router.get('/my-attendance', authenticateToken, attendanceController.getMyAttendances);

// Chấm công vào ca
router.post('/check-in', authenticateToken, attendanceController.clockIn);

// Chấm công ra ca
router.post('/check-out', authenticateToken, attendanceController.clockOut);

// Lấy thống kê chấm công của bản thân
router.get('/my-stats', authenticateToken, attendanceController.getMyAttendanceStats);

// Routes cho admin
// Lấy danh sách chấm công của tất cả nhân viên
router.get('/admin', authenticateToken, isAdmin, attendanceController.getAllAttendances);

// Tạo hoặc cập nhật bản ghi chấm công
router.post('/admin/create-update', authenticateToken, isAdmin, attendanceController.createOrUpdateAttendance);

// Xóa bản ghi chấm công
router.delete('/admin/:id', authenticateToken, isAdmin, attendanceController.deleteAttendance);

// Tạo báo cáo chấm công theo tháng
router.get('/admin/report', authenticateToken, isAdmin, attendanceController.getMonthlyReport);

// Lấy thống kê chấm công tổng quan
router.get('/admin/stats', authenticateToken, isAdmin, attendanceController.getAttendanceStats);

module.exports = router; 