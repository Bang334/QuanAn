const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalaryDetail = sequelize.define('SalaryDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  salaryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'salaries',
      key: 'id'
    },
    comment: 'Liên kết với bảng lương tháng'
  },
  salaryRateId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'salary_rates',
      key: 'id'
    },
    comment: 'Mức lương áp dụng cho ngày này (không còn sử dụng)'
  },
  attendanceId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'attendances',
      key: 'id'
    },
    comment: 'Liên kết với bảng chấm công'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Ngày làm việc'
  },
  shift: {
    type: DataTypes.ENUM('morning', 'afternoon', 'evening', 'night', 'full_day'),
    allowNull: false,
    comment: 'Ca làm việc'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Tổng tiền lương ngày'
  }
}, {
  tableName: 'salary_details',
  timestamps: true,
  indexes: [
    {
      fields: ['salaryId', 'date'],
      name: 'idx_salary_detail_salary_date'
    },
    {
      fields: ['attendanceId'],
      name: 'idx_salary_detail_attendance'
    }
  ]
});

module.exports = SalaryDetail; 