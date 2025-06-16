const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalaryRate = sequelize.define('SalaryRate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  role: {
    type: DataTypes.ENUM('waiter', 'kitchen'),
    allowNull: false,
    comment: 'Vị trí: phục vụ hoặc bếp'
  },
  shift: {
    type: DataTypes.ENUM('morning', 'afternoon', 'evening', 'night', 'full_day'),
    allowNull: false,
    comment: 'Ca làm việc: sáng, chiều, tối, đêm, cả ngày'
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Mức lương theo giờ (đồng/giờ)'
  },
  baseSalary: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Lương cơ bản cố định cho ca này (nếu có)'
  },
  effectiveDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Ngày áp dụng mức lương này'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Trạng thái: đang áp dụng hoặc không'
  },
  note: {
    type: DataTypes.TEXT,
    comment: 'Ghi chú'
  }
}, {
  tableName: 'salary_rates',
  timestamps: true,
  indexes: [
    {
      fields: ['role', 'shift', 'effectiveDate', 'isActive'],
      name: 'idx_salary_rates_lookup'
    }
  ]
});

module.exports = SalaryRate; 