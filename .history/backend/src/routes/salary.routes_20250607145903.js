const express = require('express');
const router = express.Router();
const { Salary, User } = require('../models');
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const { Op } = require('sequelize');

// Lấy lương của nhân viên đang đăng nhập
router.get('/my-salary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const salaries = await Salary.findAll({
      where: { userId },
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    
    res.json(salaries);
  } catch (error) {
    console.error('Error fetching salary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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

// Admin: Lấy danh sách lương của tất cả nhân viên
router.get('/admin', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { month, year, status } = req.query;
    
    const whereClause = {};
    
    if (month) whereClause.month = parseInt(month);
    if (year) whereClause.year = parseInt(year);
    if (status) whereClause.status = status;
    
    const salaries = await Salary.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      order: [['year', 'DESC'], ['month', 'DESC'], [User, 'name', 'ASC']]
    });
    
    res.json(salaries);
  } catch (error) {
    console.error('Error fetching all salaries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Tạo hoặc cập nhật lương cho nhân viên
router.post('/admin/create-update', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId, month, year, baseSalary, bonus, deduction, workingDays, note } = req.body;
    
    // Kiểm tra user có tồn tại không
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Tìm bản ghi lương hiện có hoặc tạo mới
    const [salary, created] = await Salary.findOrCreate({
      where: { userId, month, year },
      defaults: {
        baseSalary,
        bonus,
        deduction,
        workingDays,
        note,
        status: 'pending'
      }
    });
    
    // Nếu bản ghi đã tồn tại, cập nhật thông tin
    if (!created) {
      await salary.update({
        baseSalary,
        bonus,
        deduction,
        workingDays,
        note
      });
    }
    
    res.status(created ? 201 : 200).json(salary);
  } catch (error) {
    console.error('Error creating/updating salary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Đánh dấu lương đã thanh toán
router.put('/admin/:id/pay', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const salary = await Salary.findByPk(id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    await salary.update({
      status: 'paid',
      paidDate: new Date()
    });
    
    res.json(salary);
  } catch (error) {
    console.error('Error marking salary as paid:', error);
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

// Admin: Tạo bản ghi lương hàng loạt cho tháng hiện tại
router.post('/admin/batch-create', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { month, year, defaultBaseSalary, defaultWorkingDays } = req.body;
    
    // Lấy danh sách nhân viên (chỉ waiter và kitchen)
    const users = await User.findAll({
      where: {
        role: {
          [Op.in]: ['waiter', 'kitchen']
        }
      }
    });
    
    // Tạo bản ghi lương cho mỗi nhân viên
    const createdSalaries = [];
    
    for (const user of users) {
      const [salary, created] = await Salary.findOrCreate({
        where: { userId: user.id, month, year },
        defaults: {
          baseSalary: defaultBaseSalary || 0,
          bonus: 0,
          deduction: 0,
          workingDays: defaultWorkingDays || 0,
          status: 'pending'
        }
      });
      
      if (created) {
        createdSalaries.push(salary);
      }
    }
    
    res.status(201).json({
      message: `Created ${createdSalaries.length} salary records`,
      salaries: createdSalaries
    });
  } catch (error) {
    console.error('Error batch creating salaries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 