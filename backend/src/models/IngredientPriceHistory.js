const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IngredientPriceHistory = sequelize.define('IngredientPriceHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ingredientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Ingredients',
      key: 'id'
    }
  },
  oldPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Giá cũ của nguyên liệu'
  },
  newPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Giá mới của nguyên liệu'
  },
  changeDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Ngày thay đổi giá'
  },
  changeReason: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Lý do thay đổi giá'
  },
  changedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Người thực hiện thay đổi giá'
  }
}, {
  tableName: 'ingredient_price_history',
  timestamps: true,
  indexes: [
    {
      name: 'idx_ingredient_price_history_ingredient_id',
      fields: ['ingredientId']
    },
    {
      name: 'idx_ingredient_price_history_change_date',
      fields: ['changeDate']
    }
  ]
});

module.exports = IngredientPriceHistory; 