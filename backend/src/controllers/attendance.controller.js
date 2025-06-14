const { Attendance, User, Salary, Schedule } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// Lấy danh sách chấm công của tất cả nhân viên (Admin)
const getAllAttendances = async (req, res) => {
  try {
    const { date, userId, month, year, status } = req.query;
    
    const whereClause = {};
    
    if (date) whereClause.date = date;
    if (userId) whereClause.userId = userId;
    if (status) whereClause.status = status;
    
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    const attendances = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      order: [['date', 'DESC'], [User, 'name', 'ASC']]
    });
    
    res.json(attendances);
  } catch (error) {
    console.error('Error fetching attendances:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Lấy danh sách chấm công của nhân viên đang đăng nhập
const getMyAttendances = async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = req.user.id;
    
    let whereClause = { userId };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    const attendances = await Attendance.findAll({
      where: whereClause,
      order: [['date', 'DESC'], ['timeIn', 'DESC']],
    });
    
    res.json(attendances);
  } catch (error) {
    console.error('Error getting my attendances:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu chấm công' });
  }
};

// Chấm công vào ca
const clockIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = dayjs().format('YYYY-MM-DD');
    const now = dayjs().format('HH:mm:ss');
    
    // Kiểm tra xem đã có bản ghi chấm công cho ngày hôm nay chưa
    let attendance = await Attendance.findOne({
      where: {
        userId,
        date: today
      }
    });
    
    // Nếu đã có bản ghi và đã chấm công vào, trả về lỗi
    if (attendance && attendance.timeIn) {
      return res.status(400).json({ message: 'Bạn đã chấm công vào ca hôm nay' });
    }
    
    // Kiểm tra xem có lịch làm việc cho ngày hôm nay không
    const schedule = await Schedule.findOne({
      where: {
        userId,
        date: today,
        [Op.or]: [
          { status: 'confirmed' },
          { status: 'scheduled' }
        ]
      }
    });
    
    // Tính toán trạng thái (đúng giờ hay muộn)
    let status = 'present';
    if (schedule) {
      const scheduledStartTime = dayjs(`${today} ${schedule.startTime}`);
      const actualStartTime = dayjs(`${today} ${now}`);
      
      // Nếu đi muộn hơn 15 phút, đánh dấu là muộn
      if (actualStartTime.diff(scheduledStartTime, 'minute') > 15) {
        status = 'late';
      }
    }
    
    // Nếu chưa có bản ghi, tạo mới
    if (!attendance) {
      attendance = await Attendance.create({
        userId,
        date: today,
        timeIn: now,
        status
      });
    } else {
      // Nếu đã có bản ghi nhưng chưa chấm công vào, cập nhật
      attendance = await attendance.update({
        timeIn: now,
        status
      });
    }
    
    res.json(attendance);
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ message: 'Lỗi khi chấm công vào ca' });
  }
};

// Chấm công ra ca
const clockOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = dayjs().format('YYYY-MM-DD');
    const now = dayjs().format('HH:mm:ss');
    
    // Kiểm tra xem đã có bản ghi chấm công cho ngày hôm nay chưa
    const attendance = await Attendance.findOne({
      where: {
        userId,
        date: today
      }
    });
    
    // Nếu chưa có bản ghi hoặc chưa chấm công vào, trả về lỗi
    if (!attendance || !attendance.timeIn) {
      return res.status(400).json({ message: 'Bạn chưa chấm công vào ca hôm nay' });
    }
    
    // Nếu đã chấm công ra, trả về lỗi
    if (attendance.timeOut) {
      return res.status(400).json({ message: 'Bạn đã chấm công ra ca hôm nay' });
    }
    
    // Cập nhật thời gian chấm công ra
    await attendance.update({
      timeOut: now
    });
    
    // Cập nhật trạng thái của lịch làm việc nếu có
    const schedule = await Schedule.findOne({
      where: {
        userId,
        date: today,
        [Op.or]: [
          { status: 'confirmed' },
          { status: 'scheduled' }
        ]
      }
    });
    
    if (schedule) {
      await schedule.update({
        status: 'completed'
      });
    }
    
    res.json(attendance);
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ message: 'Lỗi khi chấm công ra ca' });
  }
};

// Admin: Tạo hoặc cập nhật bản ghi chấm công
const createOrUpdateAttendance = async (req, res) => {
  try {
    const { id, userId, date, timeIn, timeOut, status, note } = req.body;
    
    if (!userId || !date) {
      return res.status(400).json({ message: 'Thiếu thông tin nhân viên hoặc ngày' });
    }
    
    // Nếu có id, cập nhật bản ghi hiện có
    if (id) {
      const attendance = await Attendance.findByPk(id);
      
      if (!attendance) {
        return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công' });
      }
      
      await attendance.update({
        userId,
        date,
        timeIn,
        timeOut,
        status,
        note
      });
      
      return res.json(attendance);
    }
    
    // Nếu không có id, kiểm tra xem đã có bản ghi cho ngày và nhân viên này chưa
    let attendance = await Attendance.findOne({
      where: {
        userId,
        date
      }
    });
    
    // Nếu đã có, cập nhật
    if (attendance) {
      await attendance.update({
        timeIn,
        timeOut,
        status,
        note
      });
    } else {
      // Nếu chưa có, tạo mới
      attendance = await Attendance.create({
        userId,
        date,
        timeIn,
        timeOut,
        status,
        note
      });
    }
    
    res.json(attendance);
  } catch (error) {
    console.error('Error creating or updating attendance:', error);
    res.status(500).json({ message: 'Lỗi khi tạo hoặc cập nhật bản ghi chấm công' });
  }
};

// Admin: Xóa bản ghi chấm công
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attendance = await Attendance.findByPk(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công' });
    }
    
    await attendance.destroy();
    
    res.json({ message: 'Đã xóa bản ghi chấm công thành công' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ message: 'Lỗi khi xóa bản ghi chấm công' });
  }
};

// Tạo báo cáo chấm công theo tháng
const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Thiếu thông tin tháng hoặc năm' });
    }
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Lấy tất cả bản ghi chấm công trong tháng
    const attendances = await Attendance.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });
    
    // Lấy tất cả người dùng có vai trò là nhân viên
    const users = await User.findAll({
      where: {
        role: {
          [Op.in]: ['kitchen', 'waiter']
        }
      }
    });
    
    // Tạo báo cáo cho từng nhân viên
    const report = users.map(user => {
      const userAttendances = attendances.filter(a => a.userId === user.id);
      
      const totalDays = endDate.getDate();
      const presentDays = userAttendances.filter(a => a.status === 'present').length;
      const lateDays = userAttendances.filter(a => a.status === 'late').length;
      const absentDays = userAttendances.filter(a => a.status === 'absent').length;
      const workingDays = presentDays + lateDays;
      
      return {
        userId: user.id,
        name: user.name,
        role: user.role,
        totalDays,
        workingDays,
        presentDays,
        lateDays,
        absentDays,
        attendanceRate: Math.round((workingDays / totalDays) * 100)
      };
    });
    
    res.json(report);
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ message: 'Lỗi khi tạo báo cáo chấm công' });
  }
};

// Lấy thống kê chấm công tổng quan (admin)
const getAttendanceStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let whereClause = {};
    
    // Nếu có tham số tháng và năm, lọc theo tháng và năm
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    const attendances = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'role']
        }
      ]
    });
    
    // Tính toán thống kê
    const totalAttendances = attendances.length;
    const onTimeAttendances = attendances.filter(a => a.status === 'present').length;
    const lateAttendances = attendances.filter(a => a.status === 'late').length;
    const absentAttendances = attendances.filter(a => a.status === 'absent').length;
    
    // Thống kê theo vai trò
    const kitchenAttendances = attendances.filter(a => a.User.role === 'kitchen').length;
    const waiterAttendances = attendances.filter(a => a.User.role === 'waiter').length;
    
    // Thống kê theo ngày trong tuần
    const dayOfWeekStats = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, ..., Sat
    attendances.forEach(a => {
      const date = new Date(a.date);
      dayOfWeekStats[date.getDay()]++;
    });
    
    res.json({
      totalAttendances,
      onTimeAttendances,
      lateAttendances,
      absentAttendances,
      onTimePercentage: totalAttendances > 0 ? Math.round((onTimeAttendances / totalAttendances) * 100) : 0,
      kitchenAttendances,
      waiterAttendances,
      dayOfWeekStats
    });
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê chấm công' });
  }
};

// Lấy thống kê chấm công cá nhân
const getMyAttendanceStats = async (req, res) => {
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
    
    const attendances = await Attendance.findAll({
      where: whereClause
    });
    
    // Lấy thông tin lịch làm việc
    const scheduleWhereClause = { userId };
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      scheduleWhereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    const schedules = await Schedule.findAll({
      where: scheduleWhereClause
    });
    
    // Tính toán thống kê
    const totalAttendances = attendances.length;
    const onTimeAttendances = attendances.filter(a => a.status === 'present').length;
    const lateAttendances = attendances.filter(a => a.status === 'late').length;
    const absentAttendances = attendances.filter(a => a.status === 'absent').length;
    
    // Thống kê theo ngày trong tuần
    const dayOfWeekStats = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, ..., Sat
    attendances.forEach(a => {
      const date = new Date(a.date);
      dayOfWeekStats[date.getDay()]++;
    });
    
    // Thống kê lịch làm việc
    const totalSchedules = schedules.length;
    const confirmedSchedules = schedules.filter(s => s.status === 'confirmed').length;
    const completedSchedules = schedules.filter(s => s.status === 'completed').length;
    
    res.json({
      totalAttendances,
      onTimeAttendances,
      lateAttendances,
      absentAttendances,
      onTimePercentage: totalAttendances > 0 ? Math.round((onTimeAttendances / totalAttendances) * 100) : 0,
      dayOfWeekStats,
      totalSchedules,
      confirmedSchedules,
      completedSchedules,
      completionRate: totalSchedules > 0 ? Math.round(((confirmedSchedules + completedSchedules) / totalSchedules) * 100) : 0
    });
  } catch (error) {
    console.error('Error getting my attendance stats:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê chấm công cá nhân' });
  }
};

module.exports = {
  getAllAttendances,
  getMyAttendances,
  clockIn,
  clockOut,
  createOrUpdateAttendance,
  deleteAttendance,
  getMonthlyReport,
  getAttendanceStats,
  getMyAttendanceStats
}; 