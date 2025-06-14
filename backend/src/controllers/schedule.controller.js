const { Schedule, User } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// Lấy danh sách lịch làm việc của bản thân
exports.getMySchedules = async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = req.user.id;
    
    let whereClause = { userId };
    
    // Nếu có tham số tháng và năm, lọc theo tháng và năm
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    const schedules = await Schedule.findAll({
      where: whereClause,
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });
    
    res.json(schedules);
  } catch (error) {
    console.error('Error getting my schedules:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu lịch làm việc' });
  }
};

// Lấy lịch làm việc hôm nay
exports.getTodaySchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = dayjs().format('YYYY-MM-DD');
    
    const schedule = await Schedule.findOne({
      where: {
        userId,
        date: today,
        [Op.or]: [
          { status: 'scheduled' },
          { status: 'confirmed' }
        ]
      }
    });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Không có lịch làm việc hôm nay' });
    }
    
    res.json(schedule);
  } catch (error) {
    console.error('Error getting today schedule:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu lịch làm việc' });
  }
};

// Xác nhận lịch làm việc
exports.confirmSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const schedule = await Schedule.findOne({
      where: {
        id,
        userId,
        status: 'scheduled'
      }
    });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch làm việc hoặc lịch đã được xác nhận' });
    }
    
    await schedule.update({ status: 'confirmed' });
    
    res.json(schedule);
  } catch (error) {
    console.error('Error confirming schedule:', error);
    res.status(500).json({ message: 'Lỗi khi xác nhận lịch làm việc' });
  }
};

// Lấy danh sách lịch làm việc của tất cả nhân viên (admin)
exports.getAllSchedules = async (req, res) => {
  try {
    const { userId, month, year, startDate, endDate, shift, status } = req.query;
    
    let whereClause = {};
    
    // Lọc theo userId nếu có
    if (userId) {
      whereClause.userId = userId;
    }
    
    // Lọc theo tháng và năm nếu có
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      
      whereClause.date = {
        [Op.between]: [start, end]
      };
    }
    // Hoặc lọc theo khoảng thời gian nếu có
    else if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    // Lọc theo ca làm việc nếu có
    if (shift) {
      whereClause.shift = shift;
    }
    
    // Lọc theo trạng thái nếu có
    if (status) {
      whereClause.status = status;
    }
    
    const schedules = await Schedule.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });
    
    res.json(schedules);
  } catch (error) {
    console.error('Error getting all schedules:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu lịch làm việc' });
  }
};

// Tạo lịch làm việc mới (admin)
exports.createSchedule = async (req, res) => {
  try {
    const { userId, date, shift, startTime, endTime, note } = req.body;
    
    if (!userId || !date || !shift) {
      return res.status(400).json({ message: 'Thiếu thông tin nhân viên, ngày hoặc ca làm việc' });
    }
    
    // Kiểm tra xem đã có lịch làm việc cho nhân viên này vào ngày này chưa
    const existingSchedule = await Schedule.findOne({
      where: {
        userId,
        date,
        shift
      }
    });
    
    if (existingSchedule) {
      return res.status(400).json({ message: 'Đã có lịch làm việc cho nhân viên này vào ngày và ca này' });
    }
    
    const schedule = await Schedule.create({
      userId,
      date,
      shift,
      startTime,
      endTime,
      status: 'scheduled',
      note
    });
    
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ message: 'Lỗi khi tạo lịch làm việc' });
  }
};

// Cập nhật lịch làm việc (admin)
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, date, shift, startTime, endTime, status, note } = req.body;
    
    const schedule = await Schedule.findByPk(id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch làm việc' });
    }
    
    await schedule.update({
      userId,
      date,
      shift,
      startTime,
      endTime,
      status,
      note
    });
    
    res.json(schedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật lịch làm việc' });
  }
};

// Xóa lịch làm việc (admin)
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    const schedule = await Schedule.findByPk(id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch làm việc' });
    }
    
    await schedule.destroy();
    
    res.json({ message: 'Đã xóa lịch làm việc thành công' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Lỗi khi xóa lịch làm việc' });
  }
};

// Tạo lịch làm việc hàng loạt (admin)
exports.createBatchSchedules = async (req, res) => {
  try {
    const { schedules } = req.body;
    
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ message: 'Dữ liệu lịch làm việc không hợp lệ' });
    }
    
    const createdSchedules = await Schedule.bulkCreate(schedules.map(schedule => ({
      userId: schedule.userId,
      date: schedule.date,
      shift: schedule.shift,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status: 'scheduled',
      note: schedule.note
    })));
    
    res.status(201).json(createdSchedules);
  } catch (error) {
    console.error('Error creating batch schedules:', error);
    res.status(500).json({ message: 'Lỗi khi tạo lịch làm việc hàng loạt' });
  }
};

// Tạo lịch làm việc theo mẫu (admin)
exports.createScheduleTemplate = async (req, res) => {
  try {
    const { userId, startDate, endDate, weekdays, shift, startTime, endTime, note } = req.body;
    
    if (!userId || !startDate || !endDate || !weekdays || !Array.isArray(weekdays) || weekdays.length === 0 || !shift) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }
    
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    if (end.isBefore(start)) {
      return res.status(400).json({ message: 'Ngày kết thúc phải sau ngày bắt đầu' });
    }
    
    const schedules = [];
    let current = start;
    
    // Lặp qua từng ngày từ startDate đến endDate
    while (current.isSameOrBefore(end)) {
      const dayOfWeek = current.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // Nếu ngày hiện tại là một trong các ngày được chọn
      if (weekdays.includes(dayOfWeek)) {
        schedules.push({
          userId,
          date: current.format('YYYY-MM-DD'),
          shift,
          startTime,
          endTime,
          status: 'scheduled',
          note
        });
      }
      
      current = current.add(1, 'day');
    }
    
    const createdSchedules = await Schedule.bulkCreate(schedules);
    
    res.status(201).json(createdSchedules);
  } catch (error) {
    console.error('Error creating schedule template:', error);
    res.status(500).json({ message: 'Lỗi khi tạo lịch làm việc theo mẫu' });
  }
};

// Export all functions
module.exports = {
  getAllSchedules: exports.getAllSchedules,
  getMySchedules: exports.getMySchedules,
  getTodaySchedule: exports.getTodaySchedule,
  createSchedule: exports.createSchedule,
  updateSchedule: exports.updateSchedule,
  deleteSchedule: exports.deleteSchedule,
  confirmSchedule: exports.confirmSchedule,
  createBatchSchedules: exports.createBatchSchedules,
  createScheduleTemplate: exports.createScheduleTemplate
};