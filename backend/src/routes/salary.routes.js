const express = require('express');
const router = express.Router();
const { Salary, User } = require('../models');
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const { Op } = require('sequelize');
const salaryController = require('../controllers/salary.controller');

// Routes cho admin
router.get('/admin', authenticateToken, isAdmin, salaryController.getAllSalaries);
router.get('/admin/statistics', authenticateToken, isAdmin, salaryController.getSalaryStatistics);
router.get('/admin/:id', authenticateToken, isAdmin, salaryController.getSalaryById);
router.post('/admin/create-update', authenticateToken, isAdmin, salaryController.createOrUpdateSalary);
router.put('/admin/:id/pay', authenticateToken, isAdmin, salaryController.markSalaryAsPaid);

// Route tạo bảng lương đầu tháng cho tất cả nhân viên
router.post('/admin/create-monthly-payroll', authenticateToken, isAdmin, salaryController.createMonthlyPayrollForAllEmployees);

// Route cập nhật bảng lương từ chấm công
router.post('/admin/update-from-attendance/:attendanceId', authenticateToken, isAdmin, salaryController.updateSalaryFromAttendance);

// Routes cho chi tiết lương theo ngày
router.get('/admin/:salaryId/daily-details', authenticateToken, isAdmin, salaryController.getSalaryDailyDetails);
router.put('/admin/:salaryId/daily-details/:detailId', authenticateToken, isAdmin, salaryController.updateSalaryDailyDetail);

// Routes cho nhân viên
router.get('/me', authenticateToken, salaryController.getMySalary);

// Thêm route mới để lấy chi tiết lương theo ngày
router.get('/me/:salaryId/daily-details', authenticateToken, salaryController.getSalaryDailyDetails);

// Lấy chi tiết lương theo tháng và năm
router.get('/my-salary/:month/:year', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.params;
    
    const salary = await Salary.findOne({
      where: { 
        userId,
        month: parseInt(month),
        year: parseInt(year)
      }
    });
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    res.json(salary);
  } catch (error) {
    console.error('Error fetching salary detail:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Xóa bản ghi lương
router.delete('/admin/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const salary = await Salary.findByPk(id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    await salary.destroy();
    
    res.json({ message: 'Salary record deleted successfully' });
  } catch (error) {
    console.error('Error deleting salary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route để sửa các bản ghi salary_details bị lỗi NULL
router.post('/admin/fix-details/:salaryId?', authenticateToken, isAdmin, salaryController.fixSalaryDetails);

module.exports = router; 