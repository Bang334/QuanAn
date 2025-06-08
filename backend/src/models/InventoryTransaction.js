const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class InventoryTransaction extends Model {}

InventoryTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ingredientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID của nguyên liệu'
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Số lượng giao dịch (dương: nhập kho, âm: xuất kho)'
    },
    type: {
      type: DataTypes.ENUM('purchase', 'usage', 'adjustment', 'waste', 'return'),
      allowNull: false,
      comment: 'Loại giao dịch: nhập hàng, sử dụng, điều chỉnh, hủy, trả lại'
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID tham chiếu (đơn hàng, đơn đặt hàng,...)'
    },
    referenceType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Loại tham chiếu (Order, PurchaseOrder,...)'
    },
    previousQuantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Số lượng trước khi giao dịch'
    },
    newQuantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Số lượng sau khi giao dịch'
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Đơn giá tại thời điểm giao dịch'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID của người thực hiện giao dịch'
    },
    transactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    sequelize,
    modelName: 'InventoryTransaction',
    tableName: 'inventory_transactions',
  }
);

module.exports = InventoryTransaction; 