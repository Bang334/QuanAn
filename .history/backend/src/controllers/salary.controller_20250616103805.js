const { Salary, User, Attendance, Schedule, SalaryRate, SalaryDetail } = require('../models');
const { Op, Sequelize } = require('sequelize');
const dayjs = require('dayjs');
const sequelize = require('../config/database');
const { getShiftHours } = require('../utils/shiftTimes');

// Lấy danh sách lương của tất cả nhân viên (Admin)
const getAllSalaries = async (req, res) => {
  try {
    const { month, year, userId, status } = req.query;
    
    const whereClause = {};
    
    if (month) whereClause.month = parseInt(month);
    if (year) whereClause.year = parseInt(year);
    if (userId) whereClause.userId = userId;
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
    console.error('Error fetching salaries:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Lấy thống kê lương theo tháng (Admin)
const getSalaryStatistics = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    
    const monthInt = parseInt(month);
    const yearInt = parseInt(year);
    
    // Lấy danh sách lương
    const salaries = await Salary.findAll({
      where: {
        month: monthInt,
        year: yearInt
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });
    
    // Tính toán thống kê
    let totalBaseSalary = 0;
    let totalHourlyPay = 0;
    let totalBonus = 0;
    let totalDeduction = 0;
    let totalSalary = 0;
    let employeeCount = salaries.length;
    
    // Thống kê theo vai trò
    const roleStats = {
      waiter: {
        count: 0,
        totalSalary: 0,
        totalHours: 0
      },
      kitchen: {
        count: 0,
        totalSalary: 0,
        totalHours: 0
      }
    };
    
    salaries.forEach(salary => {
      // Không còn cần lấy baseSalary từ SalaryRate nữa vì đã bỏ cột salaryRateId
      const baseSalary = 0; // Bây giờ chỉ tính lương theo giờ
      totalBaseSalary += parseFloat(baseSalary);
      totalHourlyPay += parseFloat(salary.totalHourlyPay || 0);
      totalBonus += parseFloat(salary.bonus || 0);
      totalDeduction += parseFloat(salary.deduction || 0);
      
      const salaryTotal = parseFloat(baseSalary) + 
                          parseFloat(salary.totalHourlyPay || 0) + 
                          parseFloat(salary.bonus || 0) - 
                          parseFloat(salary.deduction || 0);
      
      totalSalary += salaryTotal;
      
      // Cập nhật thống kê theo vai trò
      if (salary.User?.role === 'waiter') {
        roleStats.waiter.count++;
        roleStats.waiter.totalSalary += salaryTotal;
        roleStats.waiter.totalHours += parseFloat(salary.totalHours || 0);
      } else if (salary.User?.role === 'kitchen') {
        roleStats.kitchen.count++;
        roleStats.kitchen.totalSalary += salaryTotal;
        roleStats.kitchen.totalHours += parseFloat(salary.totalHours || 0);
      }
    });
    
    res.json({
      month: monthInt,
      year: yearInt,
      employeeCount,
      totalBaseSalary,
      totalHourlyPay,
      totalBonus,
      totalDeduction,
      totalSalary,
      roleStats,
      salaries
    });
  } catch (error) {
    console.error('Error getting salary statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Lấy thông tin lương của một nhân viên
const getSalaryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const salary = await Salary.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary not found' });
    }
    
    res.json(salary);
  } catch (error) {
    console.error('Error fetching salary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Lấy lương của nhân viên đang đăng nhập
const getMySalary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    
    const whereClause = { userId };
    
    if (month) whereClause.month = parseInt(month);
    if (year) whereClause.year = parseInt(year);
    
    const salaries = await Salary.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    
    res.json(salaries);
  } catch (error) {
    console.error('Error fetching my salary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Tạo hoặc cập nhật bản ghi lương
const createOrUpdateSalary = async (req, res) => {
  try {
    const { id, userId, month, year, bonus, deduction, note } = req.body;
    
    if (!userId || !month || !year) {
      return res.status(400).json({ message: 'UserId, month, and year are required' });
    }
    
    // Kiểm tra xem đã có bản ghi lương cho nhân viên trong tháng này chưa
    let salary;
    
    if (id) {
      // Cập nhật bản ghi lương hiện có
      salary = await Salary.findByPk(id);
      
      if (!salary) {
        return res.status(404).json({ message: 'Salary record not found' });
      }
      
      // Cập nhật các trường
      await salary.update({
        bonus: bonus || 0,
        deduction: deduction || 0,
        note
      });
    } else {
      // Tìm bản ghi lương hiện có hoặc tạo mới
      [salary] = await Salary.findOrCreate({
        where: {
          userId,
          month,
          year
        },
        defaults: {
          bonus: bonus || 0,
          deduction: deduction || 0,
          totalHours: 0,
          totalHourlyPay: 0,
          status: 'pending',
          note
        }
      });
      
      // Nếu bản ghi đã tồn tại, cập nhật các trường
      if (salary) {
        await salary.update({
          bonus: bonus || 0,
          deduction: deduction || 0,
          note
        });
      }
    }
    
    // Tính toán lại tổng số giờ và lương theo giờ
    await calculateHourlyPayForSalary(salary);
    
    // Lấy bản ghi lương đã cập nhật với thông tin người dùng
    const updatedSalary = await Salary.findByPk(salary.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });
    
    res.json(updatedSalary);
  } catch (error) {
    console.error('Error creating/updating salary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Đánh dấu lương đã thanh toán
const markSalaryAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    
    const salary = await Salary.findByPk(id);
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary not found' });
    }
    
    await salary.update({
      status: 'paid',
      paidAt: new Date()
    });
    
    res.json({
      message: 'Salary marked as paid',
      salary
    });
  } catch (error) {
    console.error('Error marking salary as paid:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Hàm tính lương theo giờ cho một bản ghi lương
const calculateHourlyPayForSalary = async (salary) => {
  try {
    // Lấy tháng và năm từ bản ghi lương
    const salaryMonth = new Date(salary.month).getMonth() + 1; // 0-based -> 1-based
    const salaryYear = new Date(salary.month).getFullYear();
    
    // Lấy userId từ bản ghi lương
    const userId = salary.userId;
    
    // Lấy user info để biết role
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Lấy tất cả bản ghi chấm công của nhân viên trong tháng
    const attendances = await Attendance.findAll({
      where: {
        userId,
        [Op.and]: [
          Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('Attendance.date')), salaryMonth),
          Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('Attendance.date')), salaryYear)
        ],
        status: 'approved'
      },
      include: [
        {
          model: Schedule,
          attributes: ['id', 'shift', 'date']
        }
      ],
      order: [['date', 'ASC']]
    });
    
    // Nếu không có bản ghi chấm công nào, không cần tính toán
    if (attendances.length === 0) {
      // Tạo một bản ghi chi tiết lương mặc định để tránh NULL
      const firstDayOfMonth = new Date(salaryYear, salaryMonth - 1, 1);
      const defaultShift = 'morning';
      
      // Tìm mức lương mặc định cho vai trò của người dùng
      let defaultSalaryRate = await SalaryRate.findOne({
        where: {
          role: user.role,
          isActive: true
        },
        order: [['effectiveDate', 'DESC']]
      });
      
      // Nếu không tìm thấy, tạo một mức lương mặc định
      if (!defaultSalaryRate) {
        defaultSalaryRate = await SalaryRate.create({
          role: user.role,
          shift: defaultShift,
          hourlyRate: 25000,
          baseSalary: 0,
          effectiveDate: firstDayOfMonth,
          isActive: true,
          note: 'Mức lương mặc định được tạo tự động'
        });
      }
      
      // Tạo chi tiết lương mặc định với số lượng giờ là 0
      await SalaryDetail.create({
        salaryId: salary.id,
        salaryRateId: defaultSalaryRate.id,
        date: firstDayOfMonth,
        shift: defaultShift,
        amount: 0
      });
      
      // Cập nhật bản ghi lương với tổng = 0
      await salary.update({
        totalHourlyPay: 0,
        totalHours: 0
      });
      
      return;
    }
    
    let totalHourlyPay = 0;
    let totalHours = 0;
    
    // Xóa tất cả chi tiết lương cũ (nếu có)
    await SalaryDetail.destroy({
      where: {
        salaryId: salary.id
      }
    });
    
    // Tính lương cho từng ngày
    for (const attendance of attendances) {
      // Đảm bảo chỉ xử lý khi có dữ liệu hợp lệ
      if (attendance.hoursWorked) {
        const date = attendance.date;
        const shift = attendance.Schedule ? attendance.Schedule.shift : 'morning'; // Sử dụng từ Schedule nếu có, mặc định là 'morning'
        
        // Lấy thông tin về mức lương phù hợp cho vai trò và ca làm việc
        const userRole = user.role;
        
        let salaryRate = await SalaryRate.findOne({
          where: {
            role: userRole,
            shift,
            effectiveDate: {
              [Op.lte]: date
            },
            isActive: true
          },
          order: [['effectiveDate', 'DESC']]
        });
        
        // Nếu không tìm thấy mức lương phù hợp, sử dụng mức lương mặc định
        if (!salaryRate) {
          // Tìm mức lương mặc định cho vai trò này (bất kỳ ca nào)
          salaryRate = await SalaryRate.findOne({
            where: {
              role: userRole,
              isActive: true
            },
            order: [['effectiveDate', 'DESC']]
          });
          
          // Nếu vẫn không tìm thấy, tạo mức lương mặc định
          if (!salaryRate) {
            const defaultHourlyRate = 25000; // Mức lương mặc định (VND/giờ)
            
            salaryRate = await SalaryRate.create({
              role: userRole,
              shift: shift,
              hourlyRate: defaultHourlyRate,
              effectiveDate: new Date(salaryYear, salaryMonth - 1, 1),
              isActive: true,
              note: 'Mức lương mặc định được tạo tự động'
            });
          }
        }
        
        const hourlyRate = parseFloat(salaryRate.hourlyRate);
        const hours = parseFloat(attendance.hoursWorked);
        
        totalHours += hours;
        const dailyHourlyPay = hours * hourlyRate;
        totalHourlyPay += dailyHourlyPay;
        
        // Tạo chi tiết lương trong bảng SalaryDetail
        await SalaryDetail.create({
          salaryId: salary.id,
          salaryRateId: salaryRate.id,
          attendanceId: attendance.id,
          date,
          shift,
          amount: dailyHourlyPay
        });
      } else {
        console.warn(`Bỏ qua bản ghi chấm công không hợp lệ: attendanceId=${attendance.id}, date=${attendance.date}`);
      }
    }
    
    // Cập nhật tổng lương theo giờ và số giờ trong bản ghi lương
    await salary.update({
      totalHourlyPay,
      totalHours
    });
    
    return;
  } catch (error) {
    console.error('Error calculating hourly pay:', error);
    throw error;
  }
};

// Lấy chi tiết lương theo ngày cho một nhân viên trong tháng
const getSalaryDailyDetails = async (req, res) => {
  try {
    const { salaryId } = req.params;
    
    const salary = await Salary.findByPk(salaryId, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });
    
    if (!salary) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi lương' });
    }
    
    // Lấy chi tiết lương từ bảng SalaryDetail với thông tin đầy đủ từ Attendance
    const salaryDetails = await SalaryDetail.findAll({
      where: {
        salaryId: salary.id
      },
      include: [
        {
          model: Attendance,
          attributes: ['id', 'date', 'timeIn', 'timeOut', 'hoursWorked', 'status', 'userId'],
        },
        {
          model: SalaryRate,
          attributes: ['id', 'role', 'shift', 'hourlyRate', 'effectiveDate']
        }
      ],
      order: [['date', 'ASC']]
    });
    
    // Nếu không có chi tiết lương, tính toán lại
    if (salaryDetails.length === 0) {
      // Tìm tất cả attendance trong tháng cho nhân viên này
      const month = salary.month;
      const year = salary.year;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const attendances = await Attendance.findAll({
        where: {
          userId: salary.userId,
          date: {
            [Op.between]: [startDate, endDate]
          },
          status: 'present'
        },
        order: [['date', 'ASC']]
      });
      
      // Nếu không có attendance nào, trả về mảng rỗng
      if (attendances.length === 0) {
        return res.json({
          salary,
          dailyDetails: []
        });
      }
      
      // Tạo chi tiết lương từ attendance
      for (const attendance of attendances) {
        // Kiểm tra xem đã có chi tiết lương cho attendance này chưa
        const existingDetail = await SalaryDetail.findOne({
          where: {
            salaryId: salary.id,
            attendanceId: attendance.id
          }
        });
        
        if (!existingDetail) {
          // Tính tiền lương cho ngày này
          const hours = parseFloat(attendance.hoursWorked || 0);
          const hourlyRate = 25000; // Mức lương mặc định
          const amount = hours * hourlyRate;
          
          // Tạo chi tiết lương mới
          await SalaryDetail.create({
            salaryId: salary.id,
            attendanceId: attendance.id,
            date: attendance.date,
            shift: attendance.shift || 'morning',
            hourlyRate,
            amount
          });
        }
      }
      
      await calculateHourlyPayForSalary(salary);
      
      // Lấy lại chi tiết lương sau khi tính toán
      const recalculatedDetails = await SalaryDetail.findAll({
        where: {
          salaryId: salary.id
        },
        include: [
          {
            model: Attendance,
            attributes: ['id', 'date', 'timeIn', 'timeOut', 'hoursWorked', 'status', 'userId']
          }
        ],
        order: [['date', 'ASC']]
      });
      
      return res.json({
        salary,
        dailyDetails: recalculatedDetails
      });
    }
    
    // Chuẩn bị dữ liệu chi tiết để trả về
    const enhancedDetails = await Promise.all(salaryDetails.map(async (detail) => {
      const plainDetail = detail.get({ plain: true });
      
      // Nếu có attendance, sử dụng thông tin từ đó
      if (plainDetail.Attendance) {
        return {
          ...plainDetail,
          timeIn: plainDetail.Attendance.timeIn,
          timeOut: plainDetail.Attendance.timeOut,
          hoursWorked: plainDetail.Attendance.hoursWorked,
          status: plainDetail.Attendance.status
        };
      }
      
      return plainDetail;
    }));
    
    res.json({
      salary,
      dailyDetails: enhancedDetails
    });
  } catch (error) {
    console.error('Error getting salary daily details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cập nhật chi tiết lương theo ngày
const updateSalaryDailyDetail = async (req, res) => {
  try {
    const { salaryId, detailId } = req.params;
    // Loại bỏ tham chiếu tới salaryRateId
    const { note } = req.body;
    
    // Tìm bản ghi lương
    const salary = await Salary.findByPk(salaryId);
    
    if (!salary) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi lương' });
    }
    
    // Tìm chi tiết lương
    const salaryDetail = await SalaryDetail.findOne({
      where: {
        id: detailId,
        salaryId
      },
      include: [
        {
          model: Attendance,
          attributes: ['id', 'date', 'timeIn', 'timeOut', 'hoursWorked', 'status']
        }
      ]
    });
    
    if (!salaryDetail) {
      return res.status(404).json({ message: 'Không tìm thấy chi tiết lương cho ngày này' });
    }
    
    // Tính toán lại số tiền dựa trên giờ làm việc
    const hours = salaryDetail.Attendance ? parseFloat(salaryDetail.Attendance.hoursWorked) : 0;
    const newAmount = hours * 25000; // Dùng mức mặc định nếu không có SalaryRate
    
    // Cập nhật chi tiết lương
    await salaryDetail.update({
      amount: newAmount,
      note: note !== undefined ? note : salaryDetail.note
    });
    
    // Tính lại tổng lương theo giờ
    const allDetails = await SalaryDetail.findAll({
      where: { salaryId },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      ],
      raw: true
    });
    
    const totalPayAmount = parseFloat(allDetails[0].totalAmount || 0);
    
    // Tính tổng số giờ làm việc
    const allHours = await SalaryDetail.findAll({
      where: { salaryId },
      include: [{
        model: Attendance,
        required: true,
        attributes: ['hoursWorked']
      }],
      attributes: [
        [sequelize.fn('SUM', sequelize.col('Attendance.hoursWorked')), 'totalHours'],
      ],
      raw: true
    });
    
    // Cập nhật bản ghi lương
    await salary.update({
      totalHourlyPay: totalPayAmount,
      totalHours: parseFloat(allHours[0].totalHours || 0)
    });
    
    // Lấy bản ghi lương đã cập nhật
    const updatedSalary = await Salary.findByPk(salaryId, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });
    
    // Lấy chi tiết lương đã cập nhật
    const updatedDetails = await SalaryDetail.findAll({
      where: {
        salaryId: salaryId
      },
      include: [
        {
          model: Attendance,
          attributes: ['id', 'date', 'timeIn', 'timeOut', 'hoursWorked', 'status']
        }
      ],
      order: [['date', 'ASC']]
    });
    
    res.json({
      salary: updatedSalary,
      dailyDetails: updatedDetails
    });
  } catch (error) {
    console.error('Error updating salary daily detail:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fix missing data in salary details
const fixSalaryDetails = async (req, res) => {
  try {
    const { salaryId } = req.params;
    
    // Nếu không có salaryId, sửa tất cả
    let salaries = [];
    
    if (salaryId) {
      // Sửa một bản ghi lương cụ thể
      const salary = await Salary.findByPk(salaryId, {
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'role']
          }
        ]
      });
      
      if (!salary) {
        return res.status(404).json({ message: 'Không tìm thấy bản ghi lương' });
      }
      
      salaries.push(salary);
    } else {
      // Sửa tất cả các bản ghi lương
      salaries = await Salary.findAll({
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'role']
          }
        ]
      });
    }
    
    let fixedCount = 0;
    
    for (const salary of salaries) {
      // Tìm các chi tiết lương cần sửa
      const salaryDetails = await SalaryDetail.findAll({
        where: {
          salaryId: salary.id,
          attendanceId: null // Chỉ kiểm tra attendanceId null
        }
      });
      
      if (salaryDetails.length > 0) {
        console.log(`Đang sửa ${salaryDetails.length} chi tiết lương cho bản ghi lương ID: ${salary.id}`);
        
        // Xóa tất cả các chi tiết lương có vấn đề
        await SalaryDetail.destroy({
          where: {
            salaryId: salary.id
          }
        });
        
        // Tính toán lại từ đầu
        await calculateHourlyPayForSalary(salary);
        fixedCount += salaryDetails.length;
      }
    }
    
    res.json({
      message: `Đã sửa ${fixedCount} chi tiết lương có vấn đề`,
      fixedCount
    });
  } catch (error) {
    console.error('Error fixing salary details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Tạo bảng lương hàng tháng cho tất cả nhân viên
const createMonthlyPayrollForAllEmployees = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Cần cung cấp tháng và năm để tạo bảng lương' });
    }
    
    // Tìm tất cả nhân viên (không bao gồm admin)
    const users = await User.findAll({
      where: {
        role: {
          [Op.in]: ['waiter', 'kitchen'] // Chỉ lấy nhân viên phục vụ và bếp
        }
      }
    });
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên nào để tạo bảng lương' });
    }
    
    const results = [];
    
    // Tạo bảng lương cho từng nhân viên
    for (const user of users) {
      // Kiểm tra xem đã có bảng lương cho nhân viên trong tháng này chưa
      let salary = await Salary.findOne({
        where: {
          userId: user.id,
          month: parseInt(month),
          year: parseInt(year)
        }
      });
      
      // Nếu chưa có, tạo mới
      if (!salary) {
        salary = await Salary.create({
          userId: user.id,
          month: parseInt(month),
          year: parseInt(year),
          totalHours: 0,
          totalHourlyPay: 0,
          bonus: 0,
          deduction: 0,
          workingDays: 0,
          status: 'pending',
          note: `Lương tháng ${month}/${year} khởi tạo tự động`
        });
        
        results.push({
          userId: user.id,
          userName: user.name,
          role: user.role,
          salaryId: salary.id,
          status: 'created'
        });
      } else {
        results.push({
          userId: user.id,
          userName: user.name,
          role: user.role,
          salaryId: salary.id,
          status: 'already_exists'
        });
      }
    }
    
    res.json({
      message: `Đã tạo hoặc kiểm tra bảng lương cho ${users.length} nhân viên trong tháng ${month}/${year}`,
      results
    });
  } catch (error) {
    console.error('Error creating monthly payroll:', error);
    res.status(500).json({ message: 'Lỗi khi tạo bảng lương tháng', error: error.message });
  }
};

// Cập nhật bảng lương khi có chấm công mới
const updateSalaryFromAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    
    if (!attendanceId) {
      return res.status(400).json({ message: 'Cần cung cấp mã chấm công để cập nhật lương' });
    }
    
    // Lấy thông tin chấm công
    const attendance = await Attendance.findByPk(attendanceId, {
      include: [
        {
          model: Schedule,
          attributes: ['id', 'shift', 'date']
        }
      ]
    });
    
    if (!attendance) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công' });
    }
    
    // Lấy thông tin nhân viên từ chấm công
    const userId = attendance.userId;
    const attendanceDate = new Date(attendance.date);
    const month = attendanceDate.getMonth() + 1;
    const year = attendanceDate.getFullYear();
    
    // Tìm bảng lương của nhân viên trong tháng này
    let salary = await Salary.findOne({
      where: {
        userId,
        month,
        year
      }
    });
    
    // Nếu chưa có bảng lương, tạo mới
    if (!salary) {
      salary = await Salary.create({
        userId,
        month,
        year,
        totalHours: 0,
        totalHourlyPay: 0,
        bonus: 0,
        deduction: 0,
        workingDays: 0,
        status: 'pending',
        note: `Lương tháng ${month}/${year} được tạo tự động khi chấm công`
      });
    }
    
    // Kiểm tra xem ngày này đã có chi tiết lương chưa
    const existingSalaryDetail = await SalaryDetail.findOne({
      where: {
        salaryId: salary.id,
        attendanceId: attendance.id
      }
    });
    
    // Nếu đã có, xóa bỏ để tạo lại
    if (existingSalaryDetail) {
      await existingSalaryDetail.destroy();
    }
    
    // Tìm nhân viên để biết vai trò
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin nhân viên' });
    }
    
    // Lấy ca làm việc từ attendance hoặc schedule
    const shift = attendance.Schedule ? attendance.Schedule.shift : 'morning';
    
    // Tìm mức lương phù hợp
    let salaryRate = await SalaryRate.findOne({
      where: {
        role: user.role,
        shift,
        effectiveDate: {
          [Op.lte]: attendance.date
        },
        isActive: true
      },
      order: [['effectiveDate', 'DESC']]
    });
    
    // Nếu không tìm thấy mức lương cụ thể, tìm mức lương mặc định
    if (!salaryRate) {
      salaryRate = await SalaryRate.findOne({
        where: {
          role: user.role,
          isActive: true
        },
        order: [['effectiveDate', 'DESC']]
      });
      
      // Vẫn không tìm thấy, tạo mức lương mặc định
      if (!salaryRate) {
        salaryRate = await SalaryRate.create({
          role: user.role,
          shift,
          hourlyRate: 25000,
          effectiveDate: new Date(year, month - 1, 1),
          isActive: true,
          note: 'Mức lương mặc định được tạo tự động'
        });
      }
    }
    
    // Tính toán tiền lương cho ngày này
    const hours = parseFloat(attendance.hoursWorked) || 0;
    const hourlyRate = parseFloat(salaryRate.hourlyRate) || 0;
    const amount = hours * hourlyRate;
    
    // Tạo chi tiết lương mới
    await SalaryDetail.create({
      salaryId: salary.id,
      salaryRateId: salaryRate.id,
      attendanceId: attendance.id,
      date: attendance.date,
      shift,
      amount
    });
    
    // Tính lại tổng lương và giờ làm việc
    const result = await SalaryDetail.findAll({
      where: { salaryId: salary.id },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalDays']
      ],
      raw: true
    });
    
    const totalHourlyPay = parseFloat(result[0].totalAmount || 0);
    const workingDays = parseInt(result[0].totalDays || 0);
    
    // Tính tổng giờ làm việc
    const hoursResult = await SalaryDetail.findAll({
      where: { salaryId: salary.id },
      include: [{
        model: Attendance,
        required: true,
        attributes: []
      }],
      attributes: [
        [sequelize.fn('SUM', sequelize.col('Attendance.hoursWorked')), 'totalHours']
      ],
      raw: true
    });
    
    const totalHours = parseFloat(hoursResult[0].totalHours || 0);
    
    // Cập nhật bảng lương
    await salary.update({
      totalHourlyPay,
      totalHours,
      workingDays
    });
    
    res.json({
      message: 'Đã cập nhật bảng lương từ chấm công thành công',
      salary: await Salary.findByPk(salary.id),
      detail: {
        date: attendance.date,
        hoursWorked: hours,
        hourlyRate,
        amount
      }
    });
  } catch (error) {
    console.error('Error updating salary from attendance:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật lương từ chấm công', error: error.message });
  }
};

module.exports = {
  getAllSalaries,
  getSalaryStatistics,
  getSalaryById,
  getMySalary,
  createOrUpdateSalary,
  markSalaryAsPaid,
  getSalaryDailyDetails,
  updateSalaryDailyDetail,
  fixSalaryDetails,
  createMonthlyPayrollForAllEmployees,
  updateSalaryFromAttendance
};