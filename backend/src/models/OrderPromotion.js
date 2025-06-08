const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('./Order');
const Promotion = require('./Promotion');

const OrderPromotion = sequelize.define('OrderPromotion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: 'id'
    }
  },
  promotionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Promotion,
      key: 'id'
    }
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'order_promotions',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false
});

// Define associations
OrderPromotion.belongsTo(Order, { foreignKey: 'orderId' });
OrderPromotion.belongsTo(Promotion, { foreignKey: 'promotionId' });
Order.hasMany(OrderPromotion, { foreignKey: 'orderId' });
Promotion.hasMany(OrderPromotion, { foreignKey: 'promotionId' });

module.exports = OrderPromotion;