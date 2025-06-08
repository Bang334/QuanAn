const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class RecipeIngredient extends Model {}

RecipeIngredient.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    menuItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID của món ăn'
    },
    ingredientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID của nguyên liệu'
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      comment: 'Số lượng nguyên liệu cần cho một phần món ăn'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ghi chú về cách sử dụng nguyên liệu'
    },
    isOptional: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Đánh dấu nguyên liệu là tùy chọn'
    },
    preparationMethod: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Phương pháp chuẩn bị nguyên liệu'
    }
  },
  {
    sequelize,
    modelName: 'RecipeIngredient',
    tableName: 'recipe_ingredients',
  }
);

module.exports = RecipeIngredient; 