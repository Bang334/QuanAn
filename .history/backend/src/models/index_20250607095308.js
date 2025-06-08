const User = require('./User');
const Table = require('./Table');
const MenuItem = require('./MenuItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');
const Payment = require('./Payment');
const Promotion = require('./Promotion');
const OrderPromotion = require('./OrderPromotion');

// Define associations
Order.belongsTo(Table, { foreignKey: 'tableId' });
Table.hasMany(Order, { foreignKey: 'tableId' });

OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId' });

OrderItem.belongsTo(MenuItem, { foreignKey: 'menuItemId' });
MenuItem.hasMany(OrderItem, { foreignKey: 'menuItemId' });

// Review associations
Review.belongsTo(MenuItem, { foreignKey: 'menuItemId' });
MenuItem.hasMany(Review, { foreignKey: 'menuItemId' });

Review.belongsTo(Order, { foreignKey: 'orderId', onDelete: 'CASCADE' });
Order.hasMany(Review, { foreignKey: 'orderId', onDelete: 'CASCADE' });

Review.belongsTo(Table, { foreignKey: 'tableId', onDelete: 'CASCADE' });
Table.hasMany(Review, { foreignKey: 'tableId', onDelete: 'CASCADE' });

// Payment associations 
Payment.belongsTo(Order, { foreignKey: 'orderId' });
Order.hasOne(Payment, { foreignKey: 'orderId' });

// Promotion associations
OrderPromotion.belongsTo(Order, { foreignKey: 'orderId' });
OrderPromotion.belongsTo(Promotion, { foreignKey: 'promotionId' });
Order.hasMany(OrderPromotion, { foreignKey: 'orderId' });
Promotion.hasMany(OrderPromotion, { foreignKey: 'promotionId' });

module.exports = {
  User,
  Table,
  MenuItem,
  Order,
  OrderItem,
  Review,
  Payment,
  Promotion,
  OrderPromotion
}; 