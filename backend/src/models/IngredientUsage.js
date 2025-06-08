const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IngredientUsage = sequelize.define('IngredientUsage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'order_items',
      key: 'id'
    },
    comment: 'ID của món ăn trong đơn hàng'
  },
  ingredientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ingredients',
      key: 'id'
    },
    comment: 'ID của nguyên liệu được sử dụng'
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Số lượng nguyên liệu được sử dụng'
  },
  usageDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Ngày sử dụng nguyên liệu'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    },
    comment: 'ID của đơn hàng'
  },
  menuItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'menu_items',
      key: 'id'
    },
    comment: 'ID của món ăn'
  },
  recipeIngredientId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'recipe_ingredients',
      key: 'id'
    },
    comment: 'ID của công thức nguyên liệu'
  }
}, {
  tableName: 'ingredient_usage',
  timestamps: true,
  indexes: [
    {
      name: 'idx_ingredient_usage_order_item_id',
      fields: ['orderItemId']
    },
    {
      name: 'idx_ingredient_usage_ingredient_id',
      fields: ['ingredientId']
    },
    {
      name: 'idx_ingredient_usage_order_id',
      fields: ['orderId']
    },
    {
      name: 'idx_ingredient_usage_menu_item_id',
      fields: ['menuItemId']
    },
    {
      name: 'idx_ingredient_usage_usage_date',
      fields: ['usageDate']
    }
  ]
});

module.exports = IngredientUsage; 