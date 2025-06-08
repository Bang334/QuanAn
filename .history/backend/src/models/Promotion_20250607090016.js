const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Promotion = sequelize.define('Promotion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  discountType: {
    type: DataTypes.ENUM('percent', 'fixed'),
    allowNull: false
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  minimumOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  maximumDiscountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  applicableCategories: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Comma-separated categories or NULL for all'
  },
  usageLimit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Maximum number of uses'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Current number of uses'
  },
  promotionCode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Optional code to apply promotion'
  }
}, {
  tableName: 'promotions',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Promotion; 