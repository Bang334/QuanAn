const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Salary = sequelize.define('Salary', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalHours: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Tổng số giờ làm việc'
  },
  totalHourlyPay: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Tổng lương theo giờ'
  },
  bonus: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Tiền thưởng'
  },
  deduction: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Tiền khấu trừ'
  },
  workingDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Số ngày làm việc'
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid'),
    defaultValue: 'pending',
    comment: 'Trạng thái thanh toán lương'
  },
  note: {
    type: DataTypes.TEXT,
    comment: 'Ghi chú'
  },
  paidAt: {
    type: DataTypes.DATE,
    comment: 'Thời điểm thanh toán lương'
  }
}, {
  tableName: 'salaries',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'month', 'year'],
      unique: true,
      name: 'idx_salary_user_month_year'
    },
    {
      fields: ['status'],
      name: 'idx_salary_status'
    }
  ]
});

module.exports = Salary; 