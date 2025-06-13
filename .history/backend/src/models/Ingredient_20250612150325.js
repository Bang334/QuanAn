const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Ingredient extends Model {}

Ingredient.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Đơn vị tính (kg, g, l, ml, cái...)'
    },
    currentStock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Số lượng hiện có trong kho'
    },
    minStockLevel: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 10,
      comment: 'Số lượng tối thiểu cần có trong kho, dưới mức này sẽ cảnh báo'
    },
    costPerUnit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Giá trung bình của nguyên liệu'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Phân loại nguyên liệu (thịt, rau củ, gia vị...)'
    },
    supplier: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nhà cung cấp của nguyên liệu'
    }
  },
  {
    sequelize,
    modelName: 'Ingredient',
    tableName: 'ingredients',
  }
);

module.exports = Ingredient; 