const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class PurchaseOrder extends Model {}

PurchaseOrder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID của nhà cung cấp'
    },
    requesterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID của người yêu cầu đặt hàng (thường là nhân viên bếp)'
    },
    approverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID của người phê duyệt đơn hàng (thường là admin)'
    },
    orderDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expectedDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'delivered', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
      defaultValue: 'unpaid',
      allowNull: false,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejectReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Lý do từ chối đơn hàng'
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Số hóa đơn từ nhà cung cấp'
    },
    autoApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Đánh dấu đơn hàng được tự động phê duyệt (không cần admin)'
    }
  },
  {
    sequelize,
    modelName: 'PurchaseOrder',
    tableName: 'purchase_orders',
  }
);

module.exports = PurchaseOrder; 