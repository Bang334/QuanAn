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
      type: DataTypes.ENUM('pending', 'preparing', 'ready', 'served', 'payment_requested', 'completed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'pending: đang chờ, preparing: đang chế biến, ready: sẵn sàng phục vụ, served: đã phục vụ, payment_requested: yêu cầu thanh toán, completed: đã thanh toán, cancelled: đã hủy'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'bank'),
      defaultValue: 'cash',
      allowNull: true,
      comment: 'Phương thức thanh toán: cash (tiền mặt), bank (chuyển khoản)'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Trạng thái thanh toán: pending (chưa thanh toán), paid (đã thanh toán), refunded (đã hoàn tiền)'
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