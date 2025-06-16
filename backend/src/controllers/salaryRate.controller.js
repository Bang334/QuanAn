const { SalaryRate } = require('../models');
const { Op } = require('sequelize');

// Lấy tất cả mức lương theo ca và vị trí
const getAllSalaryRates = async (req, res) => {
  try {
    const { role, shift, isActive } = req.query;
    
    const whereClause = {};
    
    if (role) whereClause.role = role;
    if (shift) whereClause.shift = shift;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    
    const salaryRates = await SalaryRate.findAll({
      where: whereClause,
      order: [
        ['role', 'ASC'],
        ['shift', 'ASC'],
        ['effectiveDate', 'DESC']
      ]
    });
    
    res.json(salaryRates);
  } catch (error) {
    console.error('Error fetching salary rates:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu mức lương', error: error.message });
  }
};

// Lấy mức lương theo ID
const getSalaryRateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const salaryRate = await SalaryRate.findByPk(id);
    
    if (!salaryRate) {
      return res.status(404).json({ message: 'Không tìm thấy mức lương' });
    }
    
    res.json(salaryRate);
  } catch (error) {
    console.error('Error fetching salary rate:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu mức lương', error: error.message });
  }
};

// Tạo mức lương mới
const createSalaryRate = async (req, res) => {
  try {
    const { role, shift, hourlyRate, baseSalary, effectiveDate, isActive, note } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!role || !shift || hourlyRate === undefined) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    
    // Nếu đánh dấu là active, hãy vô hiệu hóa các mức lương khác cho cùng role và shift
    if (isActive) {
      await SalaryRate.update(
        { isActive: false },
        { 
          where: { 
            role, 
            shift, 
            isActive: true,
            id: { [Op.ne]: req.body.id || 0 } // Không cập nhật chính nó nếu là update
          } 
        }
      );
    }
    
    // Tạo mức lương mới
    const salaryRate = await SalaryRate.create({
      role,
      shift,
      hourlyRate,
      baseSalary: baseSalary || 0,
      effectiveDate: effectiveDate || new Date(),
      isActive: isActive !== undefined ? isActive : true,
      note
    });
    
    res.status(201).json(salaryRate);
  } catch (error) {
    console.error('Error creating salary rate:', error);
    res.status(500).json({ message: 'Lỗi khi tạo mức lương', error: error.message });
  }
};

// Cập nhật mức lương
const updateSalaryRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, shift, hourlyRate, baseSalary, effectiveDate, isActive, note } = req.body;
    
    // Tìm mức lương cần cập nhật
    const salaryRate = await SalaryRate.findByPk(id);
    
    if (!salaryRate) {
      return res.status(404).json({ message: 'Không tìm thấy mức lương' });
    }
    
    // Nếu đánh dấu là active, hãy vô hiệu hóa các mức lương khác cho cùng role và shift
    if (isActive) {
      await SalaryRate.update(
        { isActive: false },
        { 
          where: { 
            role: role || salaryRate.role, 
            shift: shift || salaryRate.shift, 
            isActive: true,
            id: { [Op.ne]: id }
          } 
        }
      );
    }
    
    // Cập nhật mức lương
    await salaryRate.update({
      role: role || salaryRate.role,
      shift: shift || salaryRate.shift,
      hourlyRate: hourlyRate !== undefined ? hourlyRate : salaryRate.hourlyRate,
      baseSalary: baseSalary !== undefined ? baseSalary : salaryRate.baseSalary,
      effectiveDate: effectiveDate || salaryRate.effectiveDate,
      isActive: isActive !== undefined ? isActive : salaryRate.isActive,
      note: note !== undefined ? note : salaryRate.note
    });
    
    res.json(salaryRate);
  } catch (error) {
    console.error('Error updating salary rate:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật mức lương', error: error.message });
  }
};

// Xóa mức lương
const deleteSalaryRate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tìm mức lương cần xóa
    const salaryRate = await SalaryRate.findByPk(id);
    
    if (!salaryRate) {
      return res.status(404).json({ message: 'Không tìm thấy mức lương' });
    }
    
    // Xóa mức lương
    await salaryRate.destroy();
    
    res.json({ message: 'Đã xóa mức lương thành công' });
  } catch (error) {
    console.error('Error deleting salary rate:', error);
    res.status(500).json({ message: 'Lỗi khi xóa mức lương', error: error.message });
  }
};

// Lấy mức lương hiện tại cho một vị trí và ca làm việc
const getCurrentSalaryRate = async (req, res) => {
  try {
    const { role, shift } = req.query;
    
    if (!role || !shift) {
      return res.status(400).json({ message: 'Thiếu thông tin vị trí hoặc ca làm việc' });
    }
    
    const salaryRate = await SalaryRate.findOne({
      where: {
        role,
        shift,
        isActive: true
      }
    });
    
    if (!salaryRate) {
      return res.status(404).json({ message: 'Không tìm thấy mức lương cho vị trí và ca làm việc này' });
    }
    
    res.json(salaryRate);
  } catch (error) {
    console.error('Error fetching current salary rate:', error);
    res.status(500).json({ message: 'Lỗi khi lấy mức lương hiện tại', error: error.message });
  }
};

module.exports = {
  getAllSalaryRates,
  getSalaryRateById,
  createSalaryRate,
  updateSalaryRate,
  deleteSalaryRate,
  getCurrentSalaryRate
}; 