const { Schedule, User } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { getShiftTimes } = require('../utils/shiftTimes');

// Thêm plugin isSameOrBefore và isBefore để sử dụng trong kiểm tra thời gian
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// Các ràng buộc về thời gian cho lịch làm việc:
// 1. Không thể phân công lịch làm việc cho ngày trong quá khứ
// 2. Không thể phân công ca làm việc đã bắt đầu hoặc đã kết thúc (trong ngày hiện tại)
// 3. Phải phân công trước thời điểm bắt đầu ca ít nhất 30 phút

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
      order: [['date', 'ASC']],
    });
    
    // Thêm thông tin thời gian bắt đầu và kết thúc dựa trên loại ca
    const schedulesWithTimes = schedules.map(schedule => {
      const plainSchedule = schedule.get({ plain: true });
      const { startTime, endTime } = getShiftTimes(plainSchedule.shift);
      return {
        ...plainSchedule,
        startTime,
        endTime
      };
    });
    
    res.json(schedulesWithTimes);
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
    
    // Thêm thông tin thời gian bắt đầu và kết thúc dựa trên loại ca
    const plainSchedule = schedule.get({ plain: true });
    const { startTime, endTime } = getShiftTimes(plainSchedule.shift);
    const scheduleWithTimes = {
      ...plainSchedule,
      startTime,
      endTime
    };
    
    res.json(scheduleWithTimes);
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
    
    // Thêm thông tin thời gian bắt đầu và kết thúc dựa trên loại ca
    const plainSchedule = schedule.get({ plain: true });
    const { startTime, endTime } = getShiftTimes(plainSchedule.shift);
    const scheduleWithTimes = {
      ...plainSchedule,
      startTime,
      endTime
    };
    
    res.json(scheduleWithTimes);
  } catch (error) {
    console.error('Error confirming schedule:', error);
    res.status(500).json({ message: 'Lỗi khi xác nhận lịch làm việc' });
  }
};

// Từ chối lịch làm việc
exports.rejectSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;
    
    const schedule = await Schedule.findOne({
      where: {
        id,
        userId,
        status: 'scheduled'
      }
    });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch làm việc hoặc lịch đã không còn ở trạng thái chờ xác nhận' });
    }
    
    await schedule.update({ 
      status: 'rejected',
      rejectReason: reason || 'Không có lý do cụ thể'
    });
    
    // Thêm thông tin thời gian bắt đầu và kết thúc dựa trên loại ca
    const plainSchedule = schedule.get({ plain: true });
    const { startTime, endTime } = getShiftTimes(plainSchedule.shift);
    const scheduleWithTimes = {
      ...plainSchedule,
      startTime,
      endTime
    };
    
    res.json(scheduleWithTimes);
  } catch (error) {
    console.error('Error rejecting schedule:', error);
    res.status(500).json({ message: 'Lỗi khi từ chối lịch làm việc' });
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
      order: [['date', 'ASC']],
    });
    
    // Thêm thông tin thời gian bắt đầu và kết thúc dựa trên loại ca
    const schedulesWithTimes = schedules.map(schedule => {
      const plainSchedule = schedule.get({ plain: true });
      const { startTime, endTime } = getShiftTimes(plainSchedule.shift);
      return {
        ...plainSchedule,
        startTime,
        endTime
      };
    });
    
    res.json(schedulesWithTimes);
  } catch (error) {
    console.error('Error getting all schedules:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu lịch làm việc' });
  }
};

// Kiểm tra ràng buộc lịch làm việc
exports.checkScheduleConstraints = async (req, res) => {
  try {
    const { userId, date } = req.query;
    
    if (!userId || !date) {
      return res.status(400).json({ message: 'Thiếu thông tin nhân viên hoặc ngày' });
    }
    
    // Lấy tất cả các ca làm việc của nhân viên trong ngày
    const existingSchedules = await Schedule.findAll({
      where: {
        userId,
        date
      }
    });
    
    const shifts = existingSchedules.map(schedule => schedule.shift);
    
    res.json({
      userId,
      date,
      shifts,
      count: shifts.length,
      hasFreeSlot: shifts.length < 2 && !shifts.includes('full_day')
    });
  } catch (error) {
    console.error('Error checking schedule constraints:', error);
    res.status(500).json({ message: 'Lỗi khi kiểm tra ràng buộc lịch làm việc' });
  }
};

// Tạo lịch làm việc mới (admin)
exports.createSchedule = async (req, res) => {
  try {
    const { userId, date, shift, note } = req.body;
    
    if (!userId || !date || !shift) {
      return res.status(400).json({ message: 'Thiếu thông tin nhân viên, ngày hoặc ca làm việc' });
    }
    
    // Kiểm tra không thể phân công lịch làm việc ở quá khứ
    const currentDate = dayjs();
    const scheduleDate = dayjs(date);
    
    // Nếu ngày phân công đã qua
    if (scheduleDate.isBefore(currentDate, 'day')) {
      return res.status(400).json({ 
        message: 'Không thể phân công lịch làm việc trong quá khứ'
      });
    }
    
    // Lấy thông tin thời gian ca làm việc
    const { startTime } = getShiftTimes(shift);
    
    // Tạo đối tượng datetime cho thời điểm ca bắt đầu
    const shiftStartDateTime = scheduleDate.hour(parseInt(startTime.split(':')[0])).minute(parseInt(startTime.split(':')[1]));
    
    // Nếu đã quá thời gian của ca làm việc trong ngày hiện tại
    if (scheduleDate.isSame(currentDate, 'day') && currentDate.isAfter(shiftStartDateTime)) {
      return res.status(400).json({ 
        message: `Không thể phân công ca ${shift} vì thời gian ca đã bắt đầu hoặc đã kết thúc`
      });
    }
    
    // Nếu thời gian hiện tại gần thời gian bắt đầu ca ít hơn 30 phút
    const minTimeBeforeShift = shiftStartDateTime.subtract(30, 'minute');
    if (currentDate.isAfter(minTimeBeforeShift)) {
      return res.status(400).json({ 
        message: 'Phải phân công ca làm việc trước thời điểm bắt đầu ca ít nhất 30 phút'
      });
    }
    
    // Kiểm tra xem đã có lịch làm việc cho nhân viên này vào ngày này với ca này chưa
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
    
    // Kiểm tra các ràng buộc về phân công ca
    const existingSchedules = await Schedule.findAll({
      where: {
        userId,
        date
      }
    });
    
    const existingShifts = existingSchedules.map(schedule => schedule.shift);
    
    // Kiểm tra ràng buộc:
    // 1. Nhân viên không thể được phân công quá 2 ca trong một ngày
    if (existingShifts.length >= 2) {
      return res.status(400).json({ 
        message: 'Nhân viên không thể được phân công quá 2 ca trong một ngày'
      });
    }
    
    // Lấy thời gian bắt đầu và kết thúc từ loại ca
    const { endTime } = getShiftTimes(shift);
    
    const schedule = await Schedule.create({
      userId,
      date,
      shift,
      status: 'scheduled',
      note,
      createdBy: 'admin'
    });
    
    // Thêm thông tin thời gian bắt đầu và kết thúc vào kết quả
    const plainSchedule = schedule.get({ plain: true });
    const scheduleWithTimes = {
      ...plainSchedule,
      startTime,
      endTime
    };
    
    res.status(201).json(scheduleWithTimes);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ message: 'Lỗi khi tạo lịch làm việc' });
  }
};

// Cập nhật lịch làm việc (admin)
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, date, shift, status, note } = req.body;
    
    const schedule = await Schedule.findByPk(id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch làm việc' });
    }
    
    await schedule.update({
      userId,
      date,
      shift,
      status,
      note
    });
    
    // Thêm thông tin thời gian bắt đầu và kết thúc dựa trên loại ca
    const plainSchedule = schedule.get({ plain: true });
    const { startTime, endTime } = getShiftTimes(plainSchedule.shift);
    const scheduleWithTimes = {
      ...plainSchedule,
      startTime,
      endTime
    };
    
    res.json(scheduleWithTimes);
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
    const { userIds, dates, shift } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 ||
        !dates || !Array.isArray(dates) || dates.length === 0 ||
        !shift) {
      return res.status(400).json({ message: 'Dữ liệu lịch làm việc không hợp lệ' });
    }
    
    const note = req.body.note || '';
    const status = req.body.status || 'scheduled';
    
    // Tạo một mảng kết quả để lưu trữ các lịch được tạo và các lỗi
    const result = {
      success: [],
      errors: []
    };
    
    // Kiểm tra ràng buộc thời gian cho tất cả các ngày
    const currentDate = dayjs();
    
    // Lấy thông tin thời gian ca làm việc
    const { startTime } = getShiftTimes(shift);
    
    // Xử lý từng cặp user-date
    for (const userId of userIds) {
      for (const date of dates) {
        try {
          // Kiểm tra không thể phân công lịch làm việc ở quá khứ
          const scheduleDate = dayjs(date);
          
          // Nếu ngày phân công đã qua
          if (scheduleDate.isBefore(currentDate, 'day')) {
            result.errors.push({
              userId,
              date,
              shift,
              message: 'Không thể phân công lịch làm việc trong quá khứ'
            });
            continue; // Bỏ qua và xử lý bản ghi tiếp theo
          }
          
          // Tạo đối tượng datetime cho thời điểm ca bắt đầu
          const shiftStartDateTime = scheduleDate.hour(parseInt(startTime.split(':')[0])).minute(parseInt(startTime.split(':')[1]));
          
          // Nếu đã quá thời gian của ca làm việc trong ngày hiện tại
          if (scheduleDate.isSame(currentDate, 'day') && currentDate.isAfter(shiftStartDateTime)) {
            result.errors.push({
              userId,
              date,
              shift,
              message: `Không thể phân công ca ${shift} vì thời gian ca đã bắt đầu hoặc đã kết thúc`
            });
            continue; // Bỏ qua và xử lý bản ghi tiếp theo
          }
          
          // Nếu thời gian hiện tại gần thời gian bắt đầu ca ít hơn 30 phút
          const minTimeBeforeShift = shiftStartDateTime.subtract(30, 'minute');
          if (currentDate.isAfter(minTimeBeforeShift)) {
            result.errors.push({
              userId,
              date,
              shift,
              message: 'Phải phân công ca làm việc trước thời điểm bắt đầu ca ít nhất 30 phút'
            });
            continue; // Bỏ qua và xử lý bản ghi tiếp theo
          }
          
          // Kiểm tra xem đã tồn tại lịch cho ca này chưa
          const existingSchedule = await Schedule.findOne({
            where: {
              userId,
              date,
              shift
            }
          });
          
          if (existingSchedule) {
            result.errors.push({
              userId,
              date,
              shift,
              message: 'Đã có lịch làm việc cho nhân viên này vào ngày và ca này'
            });
            continue; // Bỏ qua và xử lý bản ghi tiếp theo
          }
          
          // Kiểm tra các ràng buộc khác
          const existingSchedules = await Schedule.findAll({
            where: {
              userId,
              date
            }
          });
          
          const existingShifts = existingSchedules.map(sch => sch.shift);
          
          // Kiểm tra ràng buộc số ca làm việc
          if (existingShifts.length >= 2) {
            result.errors.push({
              userId,
              date,
              shift,
              message: 'Nhân viên không thể được phân công quá 2 ca trong một ngày'
            });
            continue; // Bỏ qua và xử lý bản ghi tiếp theo
          }
          
          // Nếu không vi phạm ràng buộc nào, tạo lịch làm việc
          const { endTime } = getShiftTimes(shift);
          
          const schedule = await Schedule.create({
            userId,
            date,
            shift,
            status,
            note,
            createdBy: 'admin'
          });
          
          const plainSchedule = schedule.get({ plain: true });
          result.success.push({
            ...plainSchedule,
            startTime,
            endTime
          });
        } catch (error) {
          console.error('Error creating batch schedule:', error);
          result.errors.push({
            userId,
            date,
            shift,
            message: 'Lỗi khi tạo lịch làm việc: ' + error.message
          });
        }
      }
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating batch schedules:', error);
    res.status(500).json({ message: 'Lỗi khi tạo lịch làm việc hàng loạt' });
  }
};

// Tạo lịch làm việc theo mẫu (admin)
exports.createScheduleTemplate = async (req, res) => {
  try {
    const { startDate, endDate, shifts, kitchen, waiter } = req.body;
    
    if (!startDate || !endDate || !shifts || !Array.isArray(shifts) || shifts.length === 0) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }
    
    // Lấy danh sách nhân viên
    const kitchenStaff = await User.findAll({
      where: { role: 'kitchen' },
      limit: parseInt(kitchen) || 1
    });
    
    const waiterStaff = await User.findAll({
      where: { role: 'waiter' },
      limit: parseInt(waiter) || 1
    });
    
    // Kết hợp danh sách nhân viên
    const staffList = [...kitchenStaff, ...waiterStaff];
    
    if (staffList.length === 0) {
      return res.status(400).json({ message: 'Không tìm thấy nhân viên phù hợp' });
    }
    
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    if (end.isBefore(start)) {
      return res.status(400).json({ message: 'Ngày kết thúc phải sau ngày bắt đầu' });
    }
    
    // Tạo một mảng kết quả để lưu trữ các lịch được tạo và các lỗi
    const result = {
      success: [],
      errors: []
    };
    
    let current = start;
    let staffIndex = 0;
    
    // Lặp qua từng ngày từ startDate đến endDate
    while (current.isSameOrBefore(end)) {
      // Lặp qua tất cả các ca làm việc được chọn
      for (const shift of shifts) {
        // Lặp qua số lượng nhân viên cần thiết
        for (let i = 0; i < staffList.length; i++) {
          const userId = staffList[(staffIndex + i) % staffList.length].id;
          const date = current.format('YYYY-MM-DD');
          
          try {
            // Kiểm tra xem đã tồn tại lịch cho ca này chưa
            const existingSchedule = await Schedule.findOne({
              where: {
                userId,
                date,
                shift
              }
            });
            
            if (existingSchedule) {
              result.errors.push({
                userId,
                date,
                shift,
                message: 'Đã có lịch làm việc cho nhân viên này vào ngày và ca này'
              });
              continue;
            }
            
            // Kiểm tra các ràng buộc khác
            const existingSchedules = await Schedule.findAll({
              where: {
                userId,
                date
              }
            });
            
            const existingShifts = existingSchedules.map(sch => sch.shift);
            
            // Kiểm tra ràng buộc số ca làm việc
            if (existingShifts.length >= 2) {
              result.errors.push({
                userId,
                date,
                shift,
                message: 'Nhân viên không thể được phân công quá 2 ca trong một ngày'
              });
              continue; // Bỏ qua và xử lý bản ghi tiếp theo
            }
            
            // Nếu không vi phạm ràng buộc nào, tạo lịch làm việc
            const { startTime, endTime } = getShiftTimes(shift);
            
            const schedule = await Schedule.create({
              userId,
              date,
              shift,
              status: 'scheduled',
              note: `Lịch tự động tạo cho ${shift}`,
              createdBy: 'admin'
            });
            
            const plainSchedule = schedule.get({ plain: true });
            result.success.push({
              ...plainSchedule,
              startTime,
              endTime
            });
          } catch (error) {
            console.error(`Error creating template schedule for userId=${userId}, date=${date}, shift=${shift}:`, error);
            result.errors.push({
              userId,
              date,
              shift,
              message: 'Lỗi khi tạo lịch làm việc'
            });
          }
        }
        
        staffIndex = (staffIndex + 1) % staffList.length; // Luân phiên nhân viên
      }
      
      current = current.add(1, 'day');
    }
    
    res.status(201).json({
      message: `Đã tạo thành công ${result.success.length} lịch làm việc, ${result.errors.length} lỗi`,
      success: result.success,
      errors: result.errors
    });
  } catch (error) {
    console.error('Error creating schedule template:', error);
    res.status(500).json({ message: 'Lỗi khi tạo lịch làm việc theo mẫu' });
  }
};

// Nhân viên đăng ký ca làm việc
exports.registerSchedule = async (req, res) => {
  try {
    const { date, shift, note } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!date || !shift) {
      return res.status(400).json({ message: 'Thiếu thông tin ngày hoặc ca làm việc' });
    }
    
    // Kiểm tra vai trò người dùng
    if (userRole !== 'kitchen' && userRole !== 'waiter') {
      return res.status(403).json({ message: 'Chỉ nhân viên bếp và phục vụ mới có thể đăng ký ca làm việc' });
    }
    
    // Kiểm tra xem đã có lịch làm việc cho nhân viên này vào ngày này với ca này chưa
    const existingSchedule = await Schedule.findOne({
      where: {
        userId,
        date,
        shift
      }
    });
    
    if (existingSchedule) {
      return res.status(400).json({ message: 'Bạn đã đăng ký ca làm việc này' });
    }
    
    // Kiểm tra các ràng buộc về phân công ca
    const existingSchedules = await Schedule.findAll({
      where: {
        userId,
        date
      }
    });
    
    const existingShifts = existingSchedules.map(schedule => schedule.shift);
    
    // Kiểm tra ràng buộc:
    // 1. Nhân viên không thể đăng ký quá 2 ca trong một ngày
    if (existingShifts.length >= 2) {
      return res.status(400).json({ 
        message: 'Bạn không thể đăng ký quá 2 ca trong một ngày'
      });
    }
    
    // 2. Không thể đăng ký ca full_day nếu đã có ca khác
    if (shift === 'full_day' && existingShifts.length > 0) {
      return res.status(400).json({ 
        message: 'Không thể đăng ký ca cả ngày khi đã có ca khác trong ngày'
      });
    }
    
    // 3. Không thể đăng ký ca khác nếu đã có ca full_day
    if (existingShifts.includes('full_day')) {
      return res.status(400).json({ 
        message: 'Không thể đăng ký thêm ca khi đã có ca cả ngày'
      });
    }
    
    // Kiểm tra thời gian đăng ký (phải đăng ký trước ít nhất 24 giờ)
    const registrationDate = dayjs(date);
    const now = dayjs();
    const hoursDifference = registrationDate.diff(now, 'hour');
    
    if (hoursDifference < 24) {
      return res.status(400).json({ 
        message: 'Bạn phải đăng ký ca làm việc trước ít nhất 24 giờ'
      });
    }
    
    // Lấy thời gian bắt đầu và kết thúc từ loại ca
    const { startTime, endTime } = getShiftTimes(shift);
    
    // Tạo lịch làm việc mới với trạng thái "scheduled" (chờ admin xác nhận)
    const schedule = await Schedule.create({
      userId,
      date,
      shift,
      status: 'scheduled',
      note: note || `Đăng ký bởi nhân viên ${userRole === 'kitchen' ? 'bếp' : 'phục vụ'}`,
      createdBy: 'staff'
    });
    
    // Thêm thông tin thời gian bắt đầu và kết thúc vào kết quả
    const plainSchedule = schedule.get({ plain: true });
    const scheduleWithTimes = {
      ...plainSchedule,
      startTime,
      endTime
    };
    
    res.status(201).json({
      message: 'Đăng ký ca làm việc thành công, đang chờ quản lý xác nhận',
      schedule: scheduleWithTimes
    });
  } catch (error) {
    console.error('Error registering schedule:', error);
    res.status(500).json({ message: 'Lỗi khi đăng ký ca làm việc' });
  }
};

// Nhân viên hủy đăng ký ca làm việc
exports.cancelSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Tìm lịch làm việc
    const schedule = await Schedule.findOne({
      where: {
        id,
        userId,
        status: 'scheduled' // Chỉ hủy được lịch đang ở trạng thái chờ xác nhận
      }
    });
    
    if (!schedule) {
      return res.status(404).json({ 
        message: 'Không tìm thấy lịch làm việc hoặc lịch không ở trạng thái chờ xác nhận'
      });
    }
    
    // Kiểm tra thời gian hủy (phải hủy trước ít nhất 24 giờ so với ngày làm việc)
    const workDate = dayjs(schedule.date);
    const now = dayjs();
    const hoursDifference = workDate.diff(now, 'hour');
    
    if (hoursDifference < 24) {
      return res.status(400).json({ 
        message: 'Bạn chỉ có thể hủy đăng ký ca làm việc trước ít nhất 24 giờ'
      });
    }
    
    // Cập nhật trạng thái thành cancelled thay vì xóa bản ghi
    await schedule.update({
      status: 'cancelled',
      note: (schedule.note ? schedule.note + ' ' : '') + '[Hủy bởi nhân viên]'
    });
    
    res.json({ 
      message: 'Đã hủy đăng ký ca làm việc thành công',
      scheduleId: id
    });
  } catch (error) {
    console.error('Error canceling schedule:', error);
    res.status(500).json({ message: 'Lỗi khi hủy đăng ký ca làm việc' });
  }
};

// Lấy các ca làm việc có sẵn cho nhân viên bếp và phục vụ
exports.getAvailableShifts = async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!date) {
      return res.status(400).json({ message: 'Thiếu thông tin ngày' });
    }

    // Kiểm tra vai trò người dùng
    if (userRole !== 'kitchen' && userRole !== 'waiter') {
      return res.status(403).json({ message: 'Chỉ nhân viên bếp và phục vụ mới có thể xem ca làm việc có sẵn' });
    }

    // Lấy các ca làm việc đã đăng ký của nhân viên trong ngày
    const existingSchedules = await Schedule.findAll({
      where: {
        userId,
        date
      }
    });

    const existingShifts = existingSchedules.map(schedule => schedule.shift);
    const allShifts = ['morning', 'afternoon', 'evening', 'night', 'full_day'];
    
    // Kiểm tra các ràng buộc
    let availableShifts = [];
    
    // Nếu đã có ca full_day, không có ca nào khả dụng
    if (existingShifts.includes('full_day')) {
      availableShifts = [];
    }
    // Nếu đã có 2 ca trở lên, không có ca nào khả dụng
    else if (existingShifts.length >= 2) {
      availableShifts = [];
    }
    // Nếu chưa có ca nào, tất cả các ca đều khả dụng
    else if (existingShifts.length === 0) {
      availableShifts = allShifts;
    }
    // Nếu đã có 1 ca, các ca còn lại đều khả dụng trừ full_day
    else {
      availableShifts = allShifts.filter(shift => shift !== 'full_day' && !existingShifts.includes(shift));
    }

    // Lấy thông tin thời gian cho mỗi ca
    const availableShiftsWithTimes = availableShifts.map(shift => {
      const { startTime, endTime } = getShiftTimes(shift);
      return {
        shift,
        startTime,
        endTime
      };
    });

    // Kiểm tra xem có thể đăng ký không (phải trước 24 giờ)
    const registrationDate = dayjs(date);
    const now = dayjs();
    const hoursDifference = registrationDate.diff(now, 'hour');
    const canRegister = hoursDifference >= 24;

    res.json({
      date,
      canRegister,
      registeredShifts: existingShifts,
      availableShifts: availableShiftsWithTimes,
      userRole
    });
  } catch (error) {
    console.error('Error getting available shifts:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin ca làm việc có sẵn' });
  }
};

// Lấy thông tin số lượng nhân viên đã được phân công cho từng ca trong ngày
exports.getShiftStats = async (req, res) => {
  try {
    const { date } = req.query;
    const userRole = req.user.role;

    if (!date) {
      return res.status(400).json({ message: 'Thiếu thông tin ngày' });
    }

    // Kiểm tra vai trò người dùng
    if (userRole !== 'kitchen' && userRole !== 'waiter') {
      return res.status(403).json({ message: 'Chỉ nhân viên bếp và phục vụ mới có thể xem thông tin này' });
    }

    // Lấy tất cả các ca làm việc trong ngày
    const schedules = await Schedule.findAll({
      where: {
        date,
        status: {
          [Op.in]: ['scheduled', 'confirmed']
        }
      },
      include: [
        {
          model: User,
          attributes: ['id', 'role']
        }
      ]
    });

    // Tính toán số lượng nhân viên cho từng ca và vai trò
    const shifts = ['morning', 'afternoon', 'evening', 'night', 'full_day'];
    const stats = {};

    shifts.forEach(shift => {
      // Lọc theo ca
      const shiftSchedules = schedules.filter(schedule => schedule.shift === shift);
      
      // Tổng số nhân viên trong ca
      const totalStaff = shiftSchedules.length;
      
      // Số nhân viên bếp trong ca
      const kitchenStaff = shiftSchedules.filter(schedule => schedule.User.role === 'kitchen').length;
      
      // Số nhân viên phục vụ trong ca
      const waiterStaff = shiftSchedules.filter(schedule => schedule.User.role === 'waiter').length;

      // Thêm thông tin thời gian
      const { startTime, endTime } = getShiftTimes(shift);
      
      stats[shift] = {
        totalStaff,
        kitchenStaff,
        waiterStaff,
        startTime,
        endTime
      };
    });

    res.json({
      date,
      stats
    });
  } catch (error) {
    console.error('Error getting shift statistics:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin thống kê ca làm việc' });
  }
};

// Lấy tổng quan lịch làm việc theo tuần cho nhân viên
exports.getWeeklyScheduleSummary = async (req, res) => {
  try {
    const { startDate } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!startDate) {
      return res.status(400).json({ message: 'Thiếu thông tin ngày bắt đầu tuần' });
    }

    // Tính ngày bắt đầu và kết thúc của tuần
    const start = dayjs(startDate);
    const end = start.add(6, 'day');

    // Lấy tất cả lịch làm việc của nhân viên trong tuần
    const schedules = await Schedule.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
        }
      },
      order: [['date', 'ASC']]
    });

    // Tạo cấu trúc dữ liệu cho từng ngày trong tuần
    const weekSummary = [];
    let currentDate = start;

    for (let i = 0; i < 7; i++) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      
      // Lọc lịch làm việc cho ngày hiện tại
      const daySchedules = schedules.filter(schedule => schedule.date === dateStr);
      
      // Chuyển đổi thành định dạng phù hợp
      const dayShifts = daySchedules.map(schedule => {
        const { startTime, endTime } = getShiftTimes(schedule.shift);
        return {
          id: schedule.id,
          shift: schedule.shift,
          status: schedule.status,
          startTime,
          endTime,
          note: schedule.note
        };
      });

      weekSummary.push({
        date: dateStr,
        dayOfWeek: currentDate.day(),
        dayName: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][currentDate.day()],
        shifts: dayShifts
      });

      currentDate = currentDate.add(1, 'day');
    }

    // Tính toán tổng số giờ làm việc trong tuần
    let totalHours = 0;
    schedules.forEach(schedule => {
      const { startTime, endTime } = getShiftTimes(schedule.shift);
      const start = dayjs(`2000-01-01 ${startTime}`);
      const end = dayjs(`2000-01-01 ${endTime}`);
      totalHours += end.diff(start, 'hour');
    });

    res.json({
      userRole,
      weekStartDate: start.format('YYYY-MM-DD'),
      weekEndDate: end.format('YYYY-MM-DD'),
      totalSchedules: schedules.length,
      totalHours,
      dailySummary: weekSummary
    });
  } catch (error) {
    console.error('Error getting weekly schedule summary:', error);
    res.status(500).json({ message: 'Lỗi khi lấy tổng quan lịch làm việc theo tuần' });
  }
};

// Lấy danh sách lịch làm việc do nhân viên tự đăng ký (admin)
exports.getStaffRegisteredSchedules = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    
    let whereClause = {
      createdBy: 'staff'
    };
    
    // Lọc theo khoảng thời gian nếu có
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
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
      order: [['createdAt', 'DESC']]
    });
    
    // Thêm thông tin thời gian bắt đầu và kết thúc dựa trên loại ca
    const schedulesWithTimes = schedules.map(schedule => {
      const plainSchedule = schedule.get({ plain: true });
      const { startTime, endTime } = getShiftTimes(plainSchedule.shift);
      return {
        ...plainSchedule,
        startTime,
        endTime
      };
    });
    
    // Thống kê theo trạng thái
    const statusCounts = {
      total: schedules.length,
      scheduled: schedules.filter(s => s.status === 'scheduled').length,
      confirmed: schedules.filter(s => s.status === 'confirmed').length,
      cancelled: schedules.filter(s => s.status === 'cancelled').length,
      rejected: schedules.filter(s => s.status === 'rejected').length
    };
    
    // Thống kê theo vai trò
    const roleCounts = {
      kitchen: schedules.filter(s => s.User.role === 'kitchen').length,
      waiter: schedules.filter(s => s.User.role === 'waiter').length
    };
    
    res.json({
      schedules: schedulesWithTimes,
      statistics: {
        byStatus: statusCounts,
        byRole: roleCounts
      }
    });
  } catch (error) {
    console.error('Error getting staff registered schedules:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách lịch làm việc do nhân viên đăng ký' });
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
  rejectSchedule: exports.rejectSchedule,
  createBatchSchedules: exports.createBatchSchedules,
  createScheduleTemplate: exports.createScheduleTemplate,
  checkScheduleConstraints: exports.checkScheduleConstraints,
  registerSchedule: exports.registerSchedule,
  cancelSchedule: exports.cancelSchedule,
  getAvailableShifts: exports.getAvailableShifts,
  getShiftStats: exports.getShiftStats,
  getWeeklyScheduleSummary: exports.getWeeklyScheduleSummary,
  getStaffRegisteredSchedules: exports.getStaffRegisteredSchedules
};