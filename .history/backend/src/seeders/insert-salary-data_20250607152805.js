const { Salary } = require('../models');
const sequelize = require('../config/database');

const insertSalaryData = async () => {
  try {
    console.log('Bắt đầu chèn dữ liệu lương mẫu...');

    // Xóa dữ liệu cũ (nếu cần)
    await Salary.destroy({ where: {} });
    console.log('Đã xóa dữ liệu lương cũ');

    // Lương cho nhân viên kitchen (id: 2 - Trần Thị Kitchen)
    await Salary.bulkCreate([
      {
        userId: 2,
        month: 6,
        year: 2025,
        baseSalary: 5000000,
        bonus: 500000,
        deduction: 0,
        workingDays: 26,
        status: 'paid',
        paidDate: new Date('2025-06-30'),
        note: 'Lương tháng 6/2025'
      },
      {
        userId: 2,
        month: 7,
        year: 2025,
        baseSalary: 5000000,
        bonus: 700000,
        deduction: 200000,
        workingDays: 27,
        status: 'paid',
        paidDate: new Date('2025-07-31'),
        note: 'Lương tháng 7/2025'
      },
      {
        userId: 2,
        month: 8,
        year: 2025,
        baseSalary: 5000000,
        bonus: 600000,
        deduction: 100000,
        workingDays: 25,
        status: 'pending',
        note: 'Lương tháng 8/2025'
      }
    ]);
    console.log('Đã chèn dữ liệu lương cho nhân viên kitchen (id: 2)');

    // Lương cho nhân viên kitchen (id: 4 - Phạm Thị Bếp)
    await Salary.bulkCreate([
      {
        userId: 4,
        month: 6,
        year: 2025,
        baseSalary: 4800000,
        bonus: 400000,
        deduction: 0,
        workingDays: 26,
        status: 'paid',
        paidDate: new Date('2025-06-30'),
        note: 'Lương tháng 6/2025'
      },
      {
        userId: 4,
        month: 7,
        year: 2025,
        baseSalary: 4800000,
        bonus: 600000,
        deduction: 100000,
        workingDays: 25,
        status: 'paid',
        paidDate: new Date('2025-07-31'),
        note: 'Lương tháng 7/2025'
      },
      {
        userId: 4,
        month: 8,
        year: 2025,
        baseSalary: 4800000,
        bonus: 500000,
        deduction: 0,
        workingDays: 26,
        status: 'pending',
        note: 'Lương tháng 8/2025'
      }
    ]);
    console.log('Đã chèn dữ liệu lương cho nhân viên kitchen (id: 4)');

    // Lương cho nhân viên waiter (id: 3 - Lê Văn Waiter)
    await Salary.bulkCreate([
      {
        userId: 3,
        month: 6,
        year: 2025,
        baseSalary: 4500000,
        bonus: 800000,
        deduction: 0,
        workingDays: 28,
        status: 'paid',
        paidDate: new Date('2025-06-30'),
        note: 'Lương tháng 6/2025 + thưởng doanh số'
      },
      {
        userId: 3,
        month: 7,
        year: 2025,
        baseSalary: 4500000,
        bonus: 650000,
        deduction: 200000,
        workingDays: 26,
        status: 'paid',
        paidDate: new Date('2025-07-31'),
        note: 'Lương tháng 7/2025'
      },
      {
        userId: 3,
        month: 8,
        year: 2025,
        baseSalary: 4500000,
        bonus: 900000,
        deduction: 0,
        workingDays: 27,
        status: 'pending',
        note: 'Lương tháng 8/2025 + thưởng nhân viên xuất sắc'
      }
    ]);
    console.log('Đã chèn dữ liệu lương cho nhân viên waiter (id: 3)');

    // Lương cho nhân viên waiter (id: 5 - Hoàng Văn Phục Vụ)
    await Salary.bulkCreate([
      {
        userId: 5,
        month: 6,
        year: 2025,
        baseSalary: 4300000,
        bonus: 500000,
        deduction: 100000,
        workingDays: 25,
        status: 'paid',
        paidDate: new Date('2025-06-30'),
        note: 'Lương tháng 6/2025'
      },
      {
        userId: 5,
        month: 7,
        year: 2025,
        baseSalary: 4300000,
        bonus: 600000,
        deduction: 0,
        workingDays: 26,
        status: 'paid',
        paidDate: new Date('2025-07-31'),
        note: 'Lương tháng 7/2025'
      },
      {
        userId: 5,
        month: 8,
        year: 2025,
        baseSalary: 4300000,
        bonus: 700000,
        deduction: 150000,
        workingDays: 24,
        status: 'pending',
        note: 'Lương tháng 8/2025'
      }
    ]);
    console.log('Đã chèn dữ liệu lương cho nhân viên waiter (id: 5)');

    // Lương tháng trước cho tất cả nhân viên
    await Salary.bulkCreate([
      {
        userId: 2,
        month: 5,
        year: 2025,
        baseSalary: 5000000,
        bonus: 400000,
        deduction: 100000,
        workingDays: 24,
        status: 'paid',
        paidDate: new Date('2025-05-31'),
        note: 'Lương tháng 5/2025'
      },
      {
        userId: 3,
        month: 5,
        year: 2025,
        baseSalary: 4500000,
        bonus: 700000,
        deduction: 0,
        workingDays: 26,
        status: 'paid',
        paidDate: new Date('2025-05-31'),
        note: 'Lương tháng 5/2025'
      },
      {
        userId: 4,
        month: 5,
        year: 2025,
        baseSalary: 4800000,
        bonus: 350000,
        deduction: 50000,
        workingDays: 25,
        status: 'paid',
        paidDate: new Date('2025-05-31'),
        note: 'Lương tháng 5/2025'
      },
      {
        userId: 5,
        month: 5,
        year: 2025,
        baseSalary: 4300000,
        bonus: 450000,
        deduction: 100000,
        workingDays: 24,
        status: 'paid',
        paidDate: new Date('2025-05-31'),
        note: 'Lương tháng 5/2025'
      }
    ]);
    console.log('Đã chèn dữ liệu lương tháng trước cho tất cả nhân viên');

    // Lương tháng hiện tại cho tất cả nhân viên
    await Salary.bulkCreate([
      {
        userId: 2,
        month: 9,
        year: 2025,
        baseSalary: 5000000,
        bonus: 0,
        deduction: 0,
        workingDays: 15,
        status: 'pending',
        note: 'Lương tháng 9/2025 (tạm tính)'
      },
      {
        userId: 3,
        month: 9,
        year: 2025,
        baseSalary: 4500000,
        bonus: 0,
        deduction: 0,
        workingDays: 15,
        status: 'pending',
        note: 'Lương tháng 9/2025 (tạm tính)'
      },
      {
        userId: 4,
        month: 9,
        year: 2025,
        baseSalary: 4800000,
        bonus: 0,
        deduction: 0,
        workingDays: 14,
        status: 'pending',
        note: 'Lương tháng 9/2025 (tạm tính)'
      },
      {
        userId: 5,
        month: 9,
        year: 2025,
        baseSalary: 4300000,
        bonus: 0,
        deduction: 0,
        workingDays: 15,
        status: 'pending',
        note: 'Lương tháng 9/2025 (tạm tính)'
      }
    ]);
    console.log('Đã chèn dữ liệu lương tháng hiện tại cho tất cả nhân viên');

    console.log('Hoàn thành việc chèn dữ liệu lương mẫu!');
  } catch (error) {
    console.error('Lỗi khi chèn dữ liệu lương:', error);
  } finally {
    // Đóng kết nối database nếu cần
    // await sequelize.close();
  }
};

// Thực thi hàm chèn dữ liệu
insertSalaryData();

module.exports = insertSalaryData; 