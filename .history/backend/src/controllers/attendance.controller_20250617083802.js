const { Attendance, User, Salary, Schedule } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { getShiftStartTime, getShiftEndTime, getShiftHours, isValidCheckInTime } = require('../utils/shiftTimes');
const sequelize = require('../config/database');

/**
 * Tính số giờ làm việc dựa trên thời gian check-in/check-out thực tế, nhưng giới hạn trong khung giờ của ca
 * 
 * Công thức:
 * - Thời gian bắt đầu tính giờ = max(thời gian check-in, thời gian bắt đầu ca)
 * - Thời gian kết thúc tính giờ = min(thời gian check-out, thời gian kết thúc ca)
 * - Số giờ làm việc = (thời gian kết thúc tính giờ - thời gian bắt đầu tính giờ) / 60 phút
 * 
 * Trường hợp đặc biệt:
 * - Nếu không có check-in/check-out: Trả về số giờ mặc định của ca
 * - Ca đêm: Xử lý đặc biệt vì kéo dài qua ngày hôm sau
 */
const calculateWorkHours = (shift, timeIn, timeOut, date) => {
  // Nếu không có thời gian check-in hoặc check-out, trả về số giờ mặc định của ca
  if (!timeIn || !timeOut || !date) {
    return getShiftHours(shift);
  }

  // Lấy thời gian bắt đầu và kết thúc của ca
  const shiftStartTime = getShiftStartTime(shift);
  const shiftEndTime = getShiftEndTime(shift);
  
  if (!shiftStartTime || !shiftEndTime) {
    return 0;
  }
  
  // Chuyển đổi thành đối tượng dayjs để tính toán
  const dateStr = typeof date === 'string' ? date : dayjs(date).format('YYYY-MM-DD');
  
  // Đối với ca đêm, cần xử lý đặc biệt vì kéo dài qua ngày hôm sau
  let shiftEndDate = dateStr;
  if (shift === 'night') {
    const endHour = parseInt(shiftEndTime.split(':')[0]);
    if (endHour < 12) { // Nếu giờ kết thúc là buổi sáng (ví dụ: 6:00)
      shiftEndDate = dayjs(dateStr).add(1, 'day').format('YYYY-MM-DD');
    }
  }
  
  // Tạo đối tượng dayjs cho thời gian của ca và thời gian check-in/out
  const shiftStart = dayjs(`${dateStr} ${shiftStartTime}`);
  const shiftEnd = dayjs(`${shiftEndDate} ${shiftEndTime}`);
  
  // Thời gian check-in/out thực tế
  const actualCheckIn = dayjs(`${dateStr} ${timeIn}`);
  
  // Xử lý trường hợp check-out vào ngày hôm sau
  let actualCheckOut;
  const timeOutHour = parseInt(timeOut.split(':')[0]);
  if (shift === 'night' && timeOutHour < 12) {
    actualCheckOut = dayjs(`${shiftEndDate} ${timeOut}`);
  } else {
    actualCheckOut = dayjs(`${dateStr} ${timeOut}`);
  }
  
  // Tính thời gian bắt đầu và kết thúc tính giờ làm việc
  // Thời gian bắt đầu = max(thời gian check-in, thời gian bắt đầu ca)
  // Thời gian kết thúc = min(thời gian check-out, thời gian kết thúc ca)
  const effectiveStart = actualCheckIn.isAfter(shiftStart) ? actualCheckIn : shiftStart;
  const effectiveEnd = actualCheckOut.isBefore(shiftEnd) ? actualCheckOut : shiftEnd;
  
  // Tính số giờ làm việc
  const diffHours = effectiveEnd.diff(effectiveStart, 'minute') / 60;
  
  // Làm tròn đến 2 chữ số thập phân và đảm bảo không âm
  return Math.max(0, Math.round(diffHours * 100) / 100);
};

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
        },
        {
          model: Schedule,
          attributes: ['id', 'shift', 'status'],
          required: false
        }
      ],
      order: [['date', 'DESC'], [User, 'name', 'ASC']]
    });
    
    // Thêm thông tin giờ làm việc dựa trên ca
    const attendancesWithShiftInfo = attendances.map(attendance => {
      const plainAttendance = attendance.get({ plain: true });
      
      if (plainAttendance.Schedule && plainAttendance.Schedule.shift) {
        const startTime = getShiftStartTime(plainAttendance.Schedule.shift);
        const endTime = getShiftEndTime(plainAttendance.Schedule.shift);
        const hoursWorked = calculateWorkHours(plainAttendance.Schedule.shift, plainAttendance.timeIn, plainAttendance.timeOut, plainAttendance.date);
        
        return {
          ...plainAttendance,
          shiftStartTime: startTime,
          shiftEndTime: endTime,
          hoursWorked
        };
      }
      
      return plainAttendance;
    });
    
    res.json(attendancesWithShiftInfo);
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
      include: [
        {
          model: Schedule,
          attributes: ['id', 'shift', 'status'],
          required: false
        }
      ],
      order: [['date', 'DESC'], ['timeIn', 'DESC']],
    });
    
    // Thêm thông tin giờ làm việc dựa trên ca
    const attendancesWithShiftInfo = attendances.map(attendance => {
      const plainAttendance = attendance.get({ plain: true });
      
      if (plainAttendance.Schedule && plainAttendance.Schedule.shift) {
        const startTime = getShiftStartTime(plainAttendance.Schedule.shift);
        const endTime = getShiftEndTime(plainAttendance.Schedule.shift);
        const hoursWorked = calculateWorkHours(plainAttendance.Schedule.shift, plainAttendance.timeIn, plainAttendance.timeOut, plainAttendance.date);
        
        return {
          ...plainAttendance,
          shiftStartTime: startTime,
          shiftEndTime: endTime,
          hoursWorked
        };
      }
      
      return plainAttendance;
    });
    
    res.json(attendancesWithShiftInfo);
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
    
    // Lấy scheduleId từ request body nếu có
    const { scheduleId } = req.body;
    
    // Kiểm tra xem có lịch làm việc đã xác nhận cho ngày hôm nay không
    const schedule = await Schedule.findOne({
      where: {
        userId,
        date: today,
        status: 'confirmed' // Chỉ cho phép check-in với lịch đã confirmed
      }
    });
    
    if (!schedule) {
      return res.status(400).json({ message: 'Bạn không có lịch làm việc đã được xác nhận cho hôm nay' });
    }
    
    // Nếu client gửi scheduleId, kiểm tra xem có khớp với schedule tìm được không
    if (scheduleId && schedule.id !== parseInt(scheduleId)) {
      return res.status(400).json({ message: 'ID lịch làm việc không hợp lệ' });
    }
    
    // Lấy thời gian bắt đầu và kết thúc dựa trên loại ca
    const scheduledStartTime = getShiftStartTime(schedule.shift);
    const scheduledEndTime = getShiftEndTime(schedule.shift);
    
    const scheduledStartMoment = dayjs(`${today} ${scheduledStartTime}`);
    const scheduledEndMoment = dayjs(`${today} ${scheduledEndTime}`);
    const actualCheckInMoment = dayjs(`${today} ${now}`);
    
    // Kiểm tra xem có đang check-in quá sớm không (trước 60 phút so với giờ bắt đầu ca)
    const minutesEarly = scheduledStartMoment.diff(actualCheckInMoment, 'minute');
    
    console.log('Check-in time validation:', {
      userId: req.user.id,
      userName: req.user.name,
      today,
      now,
      scheduledStartTime,
      scheduledEndTime,
      minutesEarly,
      shift: schedule.shift
    });
    
    if (minutesEarly > 60) {
      return res.status(400).json({ 
        message: `Bạn đang check-in quá sớm. Chỉ được check-in trước giờ làm việc tối đa 60 phút.`,
        scheduledTime: scheduledStartTime,
        currentTime: now,
        minutesEarly
      });
    }
    
    // Kiểm tra xem có đang check-in quá muộn không (sau khi ca kết thúc hoặc gần kết thúc)
    // Không cho phép check-in trong vòng 30 phút cuối của ca
    const minutesBeforeEnd = scheduledEndMoment.diff(actualCheckInMoment, 'minute');
    
    if (minutesBeforeEnd <= 30) {
      return res.status(400).json({ 
        message: `Bạn đang check-in quá muộn. Không thể check-in trong vòng 30 phút cuối của ca làm việc.`,
        scheduledEndTime: scheduledEndTime,
        currentTime: now,
        minutesBeforeEnd
      });
    }
    
    // Tính toán trạng thái (đúng giờ hay muộn)
    let status = 'present';
    
    // Nếu đi muộn hơn 15 phút, đánh dấu là muộn
    if (actualCheckInMoment.diff(scheduledStartMoment, 'minute') > 15) {
      status = 'late';
    }
    
    // Nếu chưa có bản ghi, tạo mới
    if (!attendance) {
      attendance = await Attendance.create({
        userId,
        scheduleId: schedule.id, // Liên kết với lịch làm việc
        date: today,
        timeIn: now,
        timeOut: null, // Để timeOut là null khi chỉ chấm công vào
        hoursWorked: 0, // Giờ làm việc sẽ được tính khi chấm công ra
        status
      });
    } else {
      // Nếu đã có bản ghi nhưng chưa chấm công vào, cập nhật
      attendance = await attendance.update({
        scheduleId: schedule.id, // Liên kết với lịch làm việc
        timeIn: now,
        timeOut: null, // Để timeOut là null khi chỉ chấm công vào
        hoursWorked: 0, // Giờ làm việc sẽ được tính khi chấm công ra
        status
      });
    }
    
    res.json({
      attendance,
      schedule,
      shiftTimes: {
        startTime: scheduledStartTime,
        endTime: scheduledEndTime
      },
      message: `Chấm công thành công. Giờ làm việc của bạn sẽ được tính từ ${scheduledStartTime} đến ${scheduledEndTime}.`
    });
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
    
    if (!schedule) {
      return res.status(400).json({ message: 'Bạn không có lịch làm việc hôm nay' });
    }
    
    // Lấy thời gian bắt đầu và kết thúc dựa trên loại ca
    const scheduledStartTime = getShiftStartTime(schedule.shift);
    const scheduledEndTime = getShiftEndTime(schedule.shift);
    
    // Kiểm tra xem đã có bản ghi chấm công cho ngày hôm nay chưa
    let attendance = await Attendance.findOne({
      where: {
        userId,
        date: today
      }
    });
    
    // Nếu chưa có bản ghi, tạo mới với thời gian check-in mặc định
    if (!attendance) {
      // Tính giờ làm việc dựa trên thời gian check-out và thời gian bắt đầu ca
      const hoursWorked = calculateWorkHours(schedule.shift, scheduledStartTime, now, today);
      
      attendance = await Attendance.create({
        userId,
        scheduleId: schedule.id, // Liên kết với lịch làm việc
        date: today,
        timeIn: scheduledStartTime, // Mặc định thời gian check-in là thời gian bắt đầu ca
        timeOut: now,
        hoursWorked,
        status: 'late'  // Đánh dấu là đi muộn vì không check-in
      });
      
      // Tự động cập nhật bảng lương khi check-out tự động
      try {
        const { updateSalaryFromAttendance } = require('./salary.controller');
        
        // Tạo request và response giả cho controller
        const updateSalaryReq = { params: { attendanceId: attendance.id } };
        const updateSalaryRes = { 
          json: (data) => console.log('Salary updated from attendance on auto check-in/out:', data),
          status: (code) => ({ 
            json: (data) => console.error(`Error updating salary on auto check-in/out (${code}):`, data) 
          })
        };
        
        // Gọi hàm cập nhật lương
        await updateSalaryFromAttendance(updateSalaryReq, updateSalaryRes);
      } catch (salaryError) {
        console.error('Error updating salary from auto check-in/out:', salaryError);
        // Không ảnh hưởng đến kết quả trả về của API chấm công
      }
      
      return res.json({
        attendance,
        schedule,
        shiftTimes: {
          startTime: scheduledStartTime,
          endTime: scheduledEndTime
        },
        message: `Đã tự động chấm công vào và ra ca. Giờ làm việc được tính từ ${scheduledStartTime} đến ${now}.`
      });
    }
    
    // Nếu đã có bản ghi nhưng chưa chấm công vào, cập nhật cả vào và ra
    if (!attendance.timeIn) {
      // Tính giờ làm việc dựa trên thời gian check-out và thời gian bắt đầu ca
      const hoursWorked = calculateWorkHours(schedule.shift, scheduledStartTime, now, today);
      
      await attendance.update({
        scheduleId: schedule.id, // Liên kết với lịch làm việc
        timeIn: scheduledStartTime, // Mặc định thời gian check-in là thời gian bắt đầu ca
        timeOut: now,
        hoursWorked,
        status: 'late'  // Đánh dấu là đi muộn vì không check-in đúng giờ
      });
      
      // Tự động cập nhật bảng lương khi check-out tự động
      try {
        const { updateSalaryFromAttendance } = require('./salary.controller');
        
        // Tạo request và response giả cho controller
        const updateSalaryReq = { params: { attendanceId: attendance.id } };
        const updateSalaryRes = { 
          json: (data) => console.log('Salary updated from attendance on auto check-in/out:', data),
          status: (code) => ({ 
            json: (data) => console.error(`Error updating salary on auto check-in/out (${code}):`, data) 
          })
        };
        
        // Gọi hàm cập nhật lương
        await updateSalaryFromAttendance(updateSalaryReq, updateSalaryRes);
      } catch (salaryError) {
        console.error('Error updating salary from auto check-in/out:', salaryError);
        // Không ảnh hưởng đến kết quả trả về của API chấm công
      }
      
      return res.json({
        attendance,
        schedule,
        shiftTimes: {
          startTime: scheduledStartTime,
          endTime: scheduledEndTime
        },
        message: `Đã tự động chấm công vào và ra ca. Giờ làm việc được tính từ ${scheduledStartTime} đến ${now}.`
      });
    }
    
    // Nếu đã chấm công ra, trả về lỗi
    if (attendance.timeOut) {
      return res.status(400).json({ message: 'Bạn đã chấm công ra ca hôm nay' });
    }
    
    // Kiểm tra thời gian check-out phải sau thời gian check-in
    const timeInMoment = dayjs(`${today} ${attendance.timeIn}`);
    const timeOutMoment = dayjs(`${today} ${now}`);
    
    if (timeOutMoment.isBefore(timeInMoment) || timeOutMoment.isSame(timeInMoment)) {
      return res.status(400).json({ 
        message: 'Thời gian chấm công ra phải sau thời gian chấm công vào',
        timeIn: attendance.timeIn,
        timeOut: now
      });
    }
    
    // Tính giờ làm việc dựa trên thời gian check-in thực tế và thời gian check-out hiện tại
    const hoursWorked = calculateWorkHours(schedule.shift, attendance.timeIn, now, today);
    
    // Cập nhật thời gian chấm công ra
    await attendance.update({
      scheduleId: schedule.id, // Liên kết với lịch làm việc (đảm bảo)
      timeOut: now,
      hoursWorked
    });
    
    // Tự động cập nhật bảng lương khi check-out thành công
    try {
      const { updateSalaryFromAttendance } = require('./salary.controller');
      
      // Tạo request và response giả cho controller
      const updateSalaryReq = { params: { attendanceId: attendance.id } };
      const updateSalaryRes = { 
        json: (data) => console.log('Salary updated from attendance on check-out:', data),
        status: (code) => ({ 
          json: (data) => console.error(`Error updating salary on check-out (${code}):`, data) 
        })
      };
      
      // Gọi hàm cập nhật lương
      await updateSalaryFromAttendance(updateSalaryReq, updateSalaryRes);
    } catch (salaryError) {
      console.error('Error updating salary from check-out:', salaryError);
      // Không ảnh hưởng đến kết quả trả về của API chấm công
    }
    
    res.json({
      attendance,
      schedule,
      shiftTimes: {
        startTime: scheduledStartTime,
        endTime: scheduledEndTime
      },
      message: `Chấm công ra ca thành công. Giờ làm việc được tính từ ${attendance.timeIn} đến ${now}.`
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ message: 'Lỗi khi chấm công ra ca', error: error.message });
  }
};

// Admin: Tạo hoặc cập nhật bản ghi chấm công
const createOrUpdateAttendance = async (req, res) => {
  try {
    const { id, userId, date, timeIn, timeOut, status, note } = req.body;
    
    if (!userId || !date) {
      return res.status(400).json({ message: 'Thiếu thông tin nhân viên hoặc ngày' });
    }
    
    // Tìm lịch làm việc tương ứng để tính giờ làm việc
    const schedule = await Schedule.findOne({
      where: {
        userId,
        date,
        [Op.or]: [
          { status: 'confirmed' },
          { status: 'scheduled' }
        ]
      }
    });
    
    // Tính số giờ làm việc dựa trên ca nếu có lịch
    let hoursWorked = null;
    let scheduleId = null;
    
    if (schedule) {
      hoursWorked = calculateWorkHours(schedule.shift, timeIn, timeOut, date);
      scheduleId = schedule.id;
    }
    
    let attendance;
    let isNewOrUpdated = false;
    
    // Nếu có id, cập nhật bản ghi hiện có
    if (id) {
      attendance = await Attendance.findByPk(id);
      
      if (!attendance) {
        return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công' });
      }
      
      await attendance.update({
        userId,
        scheduleId,
        date,
        timeIn,
        timeOut,
        hoursWorked,
        status,
        note
      });
      
      isNewOrUpdated = true;
    } else {
      // Nếu không có id, kiểm tra xem đã có bản ghi cho ngày và nhân viên này chưa
      attendance = await Attendance.findOne({
        where: {
          userId,
          date
        }
      });
      
      // Nếu đã có, cập nhật
      if (attendance) {
        await attendance.update({
          scheduleId,
          timeIn,
          timeOut,
          hoursWorked,
          status,
          note
        });
      } else {
        // Nếu chưa có, tạo mới
        attendance = await Attendance.create({
          userId,
          scheduleId,
          date,
          timeIn,
          timeOut,
          hoursWorked,
          status,
          note
        });
      }
      
      isNewOrUpdated = true;
    }
    
    // Nếu là bản ghi mới hoặc cập nhật và status là 'approved' hoặc 'present',
    // tự động cập nhật bảng lương
    if (isNewOrUpdated && (status === 'approved' || status === 'present') && attendance.id) {
      try {
        // Gọi API để cập nhật lương
        const axios = require('axios');
        
        // Dùng API nội bộ nên không cần gọi HTTP thật
        const { updateSalaryFromAttendance } = require('./salary.controller');
        
        // Tạo request và response giả cho controller
        const req = { params: { attendanceId: attendance.id } };
        const res = { 
          json: (data) => console.log('Salary updated from attendance:', data),
          status: (code) => ({ 
            json: (data) => console.error(`Error updating salary (${code}):`, data) 
          })
        };
        
        // Gọi hàm cập nhật lương
        await updateSalaryFromAttendance(req, res);
      } catch (salaryError) {
        console.error('Error updating salary from attendance:', salaryError);
        // Không ảnh hưởng đến kết quả trả về của API chấm công
      }
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

// Lấy thống kê chấm công của tất cả nhân viên (Admin)
const getAttendanceStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Nếu không có tháng hoặc năm, sử dụng tháng hiện tại
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    // Tạo ngày bắt đầu và kết thúc của tháng
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);
    
    // Lấy tất cả lịch làm việc trong tháng
    const schedules = await Schedule.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });
    
    // Lấy tất cả bản ghi chấm công trong tháng
    const attendances = await Attendance.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });
    
    // Tạo map từ userId sang danh sách chấm công
    const attendancesByUser = {};
    attendances.forEach(att => {
      if (!attendancesByUser[att.userId]) {
        attendancesByUser[att.userId] = [];
      }
      attendancesByUser[att.userId].push(att);
    });
    
    // Tạo map từ userId sang danh sách lịch làm việc
    const schedulesByUser = {};
    schedules.forEach(sch => {
      if (!schedulesByUser[sch.userId]) {
        schedulesByUser[sch.userId] = [];
      }
      schedulesByUser[sch.userId].push(sch);
    });
    
    // Lấy danh sách tất cả nhân viên
    const users = await User.findAll({
      where: {
        role: {
          [Op.in]: ['employee', 'manager']
        }
      },
      attributes: ['id', 'name', 'email', 'role']
    });
    
    // Tính toán thống kê cho từng nhân viên
    const userStats = users.map(user => {
      const userAttendances = attendancesByUser[user.id] || [];
      const userSchedules = schedulesByUser[user.id] || [];
      
      // Tính số lần đi làm đúng giờ, đi muộn, vắng mặt
      const onTime = userAttendances.filter(a => a.status === 'present').length;
      const late = userAttendances.filter(a => a.status === 'late').length;
      const absent = userAttendances.filter(a => a.status === 'absent').length;
      
      // Tính tổng số giờ làm việc
      const totalHours = userAttendances.reduce((sum, att) => sum + (att.hoursWorked || 0), 0);
      
      // Tính số ca làm việc đã lên lịch
      const totalSchedules = userSchedules.length;
      const confirmedSchedules = userSchedules.filter(s => s.status === 'confirmed').length;
      // Không còn sử dụng trạng thái 'completed' nữa
      
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        stats: {
          totalSchedules,
          confirmedSchedules,
          onTime,
          late,
          absent,
          totalHours,
          attendanceRate: totalSchedules > 0 ? Math.round(((onTime + late) / totalSchedules) * 100) : 0,
          completionRate: totalSchedules > 0 ? Math.round((confirmedSchedules / totalSchedules) * 100) : 0
        }
      };
    });
    
    res.json(userStats);
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê chấm công' });
  }
};

// Lấy thống kê chấm công của nhân viên đang đăng nhập
const getMyAttendanceStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = req.user.id;
    
    // Nếu không có tháng hoặc năm, sử dụng tháng hiện tại
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    // Tạo ngày bắt đầu và kết thúc của tháng
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);
    
    // Lấy tất cả lịch làm việc trong tháng của nhân viên
    const schedules = await Schedule.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });
    
    // Lấy tất cả bản ghi chấm công trong tháng của nhân viên
    const attendances = await Attendance.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });
    
    // Tính số lần đi làm đúng giờ, đi muộn, vắng mặt
    const onTime = attendances.filter(a => a.status === 'present').length;
    const late = attendances.filter(a => a.status === 'late').length;
    const absent = attendances.filter(a => a.status === 'absent').length;
    
    // Tính tổng số giờ làm việc
    const totalHours = attendances.reduce((sum, att) => sum + (att.hoursWorked || 0), 0);
    
    // Tính số ca làm việc đã lên lịch
    const totalSchedules = schedules.length;
    const confirmedSchedules = schedules.filter(s => s.status === 'confirmed').length;
    // Không còn sử dụng trạng thái 'completed' nữa
    
    const stats = {
      totalSchedules,
      confirmedSchedules,
      onTime,
      late,
      absent,
      totalHours,
      attendanceRate: totalSchedules > 0 ? Math.round(((onTime + late) / totalSchedules) * 100) : 0,
      completionRate: totalSchedules > 0 ? Math.round((confirmedSchedules / totalSchedules) * 100) : 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting my attendance stats:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê chấm công' });
  }
};

// Tự động đánh dấu vắng mặt cho nhân viên không chấm công
const markAbsentEmployees = async () => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    
    // Lấy tất cả lịch làm việc của ngày hôm nay mà đã được confirm
    const schedules = await Schedule.findAll({
      where: {
        date: today,
        status: 'confirmed' // Chỉ xét những lịch làm việc đã được confirm
      }
    });
    
    // Không có lịch làm việc nào cần xử lý
    if (!schedules || schedules.length === 0) {
      console.log('Không có lịch làm việc nào cần đánh dấu vắng mặt');
      return [];
    }
    
    // Lấy danh sách userId từ các lịch làm việc
    const userIds = schedules.map(schedule => schedule.userId);
    
    // Lấy các bản ghi chấm công đã tồn tại cho ngày hôm nay
    const existingAttendances = await Attendance.findAll({
      where: {
        date: today,
        userId: {
          [Op.in]: userIds
        }
      }
    });
    
    // Tạo map từ userId sang attendance để dễ dàng kiểm tra
    const attendanceMap = {};
    existingAttendances.forEach(att => {
      attendanceMap[att.userId] = att;
    });
    
    // Tạo các bản ghi vắng mặt cho những nhân viên không chấm công
    const absentRecords = [];
    
    for (const schedule of schedules) {
      // Nếu nhân viên đã có bản ghi chấm công, bỏ qua
      if (attendanceMap[schedule.userId]) {
        continue;
      }
      
      // Tạo bản ghi vắng mặt
      const absentRecord = await Attendance.create({
        userId: schedule.userId,
        scheduleId: schedule.id,
        date: today,
        status: 'absent',
        note: 'Tự động đánh dấu vắng mặt do không chấm công'
      });
      
      absentRecords.push(absentRecord);
    }
    
    return absentRecords;
  } catch (error) {
    console.error('Lỗi khi đánh dấu vắng mặt tự động:', error);
    return [];
  }
};

// API endpoint để chạy quá trình đánh dấu vắng mặt (chỉ dành cho admin)
const runAbsentMarking = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Không có quyền thực hiện thao tác này' });
    }
    
    const absentRecords = await markAbsentEmployees();
    
    res.json({
      success: true,
      message: `Đã đánh dấu vắng mặt cho ${absentRecords.length} nhân viên có lịch làm việc đã confirm nhưng không chấm công`,
      records: absentRecords
    });
  } catch (error) {
    console.error('Lỗi khi chạy quá trình đánh dấu vắng mặt:', error);
    res.status(500).json({ message: 'Lỗi khi chạy quá trình đánh dấu vắng mặt' });
  }
};

// Tự động reject lịch làm việc khi thời gian vào ca cách thời gian hiện tại dưới 1 tiếng
const autoRejectNearbySchedules = async () => {
  try {
    const now = dayjs();
    const today = now.format('YYYY-MM-DD');
    
    // Lấy tất cả lịch làm việc của ngày hôm nay có trạng thái scheduled
    const schedules = await Schedule.findAll({
      where: {
        date: today,
        status: 'scheduled' // Chỉ xét những lịch làm việc chưa được confirm
      }
    });
    
    if (!schedules || schedules.length === 0) {
      console.log('Không có lịch làm việc nào cần xét reject tự động');
      return [];
    }
    
    const rejectedSchedules = [];
    
    for (const schedule of schedules) {
      // Lấy thời gian bắt đầu ca
      const shiftStartTime = getShiftStartTime(schedule.shift);
      if (!shiftStartTime) continue;
      
      // Tạo đối tượng dayjs cho thời gian bắt đầu ca
      const shiftStartMoment = dayjs(`${today} ${shiftStartTime}`);
      
      // Tính khoảng cách thời gian từ hiện tại đến giờ bắt đầu ca (tính bằng phút)
      const minutesUntilShift = shiftStartMoment.diff(now, 'minute');
      
      // Nếu thời gian còn lại đến ca làm việc ít hơn 60 phút (1 tiếng), tự động reject
      if (minutesUntilShift >= 0 && minutesUntilShift < 60) {
        await schedule.update({
          status: 'rejected',
          rejectReason: 'Tự động từ chối do thời gian đăng ký quá gần thời gian bắt đầu ca (dưới 1 tiếng)'
        });
        
        rejectedSchedules.push(schedule);
      }
    }
    
    return rejectedSchedules;
  } catch (error) {
    console.error('Lỗi khi tự động reject lịch làm việc:', error);
    return [];
  }
};

// API endpoint để chạy quá trình reject tự động (chỉ dành cho admin)
const runAutoReject = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Không có quyền thực hiện thao tác này' });
    }
    
    const rejectedSchedules = await autoRejectNearbySchedules();
    
    res.json({
      success: true,
      message: `Đã tự động reject ${rejectedSchedules.length} lịch làm việc do đăng ký quá gần thời gian bắt đầu ca (dưới 1 tiếng)`,
      records: rejectedSchedules
    });
  } catch (error) {
    console.error('Lỗi khi chạy quá trình reject tự động:', error);
    res.status(500).json({ message: 'Lỗi khi chạy quá trình reject tự động' });
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
  getMyAttendanceStats,
  runAbsentMarking,
  markAbsentEmployees,
  runAutoReject,
  autoRejectNearbySchedules
}; 