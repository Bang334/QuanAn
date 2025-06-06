const User = require('./User');
const Table = require('./Table');
const MenuItem = require('./MenuItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

// Define associations
Order.belongsTo(Table, { foreignKey: 'tableId' });
Table.hasMany(Order, { foreignKey: 'tableId' });

OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId' });

OrderItem.belongsTo(MenuItem, { foreignKey: 'menuItemId' });
MenuItem.hasMany(OrderItem, { foreignKey: 'menuItemId' });

module.exports = {
  User,
  Table,
  MenuItem,
  Order,
  OrderItem
}; 