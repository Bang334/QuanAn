const User = require('./User');
const Table = require('./Table');
const MenuItem = require('./MenuItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');

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

Review.belongsTo(Order, { foreignKey: 'orderId' });
Order.hasMany(Review, { foreignKey: 'orderId' });

Review.belongsTo(Table, { foreignKey: 'tableId' });
Table.hasMany(Review, { foreignKey: 'tableId' });

module.exports = {
  User,
  Table,
  MenuItem,
  Order,
  OrderItem,
  Review
}; 