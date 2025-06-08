const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class PurchaseOrderItem extends Model {}

PurchaseOrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    purchaseOrderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID của đơn đặt hàng'
    },
    ingredientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID của nguyên liệu'
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Số lượng đặt hàng'
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Giá đơn vị'
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Tổng giá (quantity * unitPrice)'
    },
    receivedQuantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Số lượng đã nhận'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'partial', 'complete', 'cancelled'),
      defaultValue: 'pending',
      comment: 'Trạng thái của mặt hàng trong đơn hàng'
    }
  },
  {
    sequelize,
    modelName: 'PurchaseOrderItem',
    tableName: 'purchase_order_items',
  }
);

module.exports = PurchaseOrderItem; 