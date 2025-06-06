const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tableId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'paid'),
      defaultValue: 'unpaid',
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'card', 'momo', 'zalopay', 'vnpay'),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
  }
);

module.exports = Order; 