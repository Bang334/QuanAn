const User = require('./User');
const Table = require('./Table');
const MenuItem = require('./MenuItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');
const Payment = require('./Payment');
const Promotion = require('./Promotion');
const OrderPromotion = require('./OrderPromotion');
const Salary = require('./Salary');
const SalaryRate = require('./SalaryRate');
const SalaryDetail = require('./SalaryDetail');
const Ingredient = require('./Ingredient');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const RecipeIngredient = require('./RecipeIngredient');
const InventoryTransaction = require('./InventoryTransaction');
const KitchenPermission = require('./KitchenPermission');
const IngredientPriceHistory = require('./IngredientPriceHistory');
const IngredientUsage = require('./IngredientUsage');
const Attendance = require('./Attendance');
const Schedule = require('./Schedule');

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

// Salary associations
Salary.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Salary, { foreignKey: 'userId' });

// SalaryDetail associations
SalaryDetail.belongsTo(Salary, { foreignKey: 'salaryId' });
Salary.hasMany(SalaryDetail, { foreignKey: 'salaryId' });

SalaryDetail.belongsTo(SalaryRate, { foreignKey: 'salaryRateId' });
SalaryRate.hasMany(SalaryDetail, { foreignKey: 'salaryRateId' });

SalaryDetail.belongsTo(Attendance, { foreignKey: 'attendanceId' });
Attendance.hasMany(SalaryDetail, { foreignKey: 'attendanceId' });

// Inventory associations
RecipeIngredient.belongsTo(MenuItem, { foreignKey: 'menuItemId' });
MenuItem.hasMany(RecipeIngredient, { foreignKey: 'menuItemId' });

RecipeIngredient.belongsTo(Ingredient, { foreignKey: 'ingredientId' });
Ingredient.hasMany(RecipeIngredient, { foreignKey: 'ingredientId' });

// Purchase Order associations
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId' });
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplierId' });

PurchaseOrder.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
PurchaseOrder.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });

PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId' });
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchaseOrderId' });

PurchaseOrderItem.belongsTo(Ingredient, { foreignKey: 'ingredientId' });
Ingredient.hasMany(PurchaseOrderItem, { foreignKey: 'ingredientId' });

// Inventory Transaction associations
InventoryTransaction.belongsTo(Ingredient, { foreignKey: 'ingredientId' });
Ingredient.hasMany(InventoryTransaction, { foreignKey: 'ingredientId' });

InventoryTransaction.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(InventoryTransaction, { foreignKey: 'userId' });

// Kitchen Permission associations
KitchenPermission.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(KitchenPermission, { foreignKey: 'userId' });

KitchenPermission.belongsTo(User, { foreignKey: 'grantedById', as: 'grantor' });

// Ingredient - IngredientPriceHistory relationship
Ingredient.hasMany(IngredientPriceHistory, { foreignKey: 'ingredientId' });
IngredientPriceHistory.belongsTo(Ingredient, { foreignKey: 'ingredientId' });

// User - IngredientPriceHistory relationship
User.hasMany(IngredientPriceHistory, { foreignKey: 'changedBy' });
IngredientPriceHistory.belongsTo(User, { foreignKey: 'changedBy', as: 'priceChanger' });

// OrderItem - IngredientUsage relationship
OrderItem.hasMany(IngredientUsage, { foreignKey: 'orderItemId' });
IngredientUsage.belongsTo(OrderItem, { foreignKey: 'orderItemId' });

// Ingredient - IngredientUsage relationship
Ingredient.hasMany(IngredientUsage, { foreignKey: 'ingredientId' });
IngredientUsage.belongsTo(Ingredient, { foreignKey: 'ingredientId' });

// Order - IngredientUsage relationship
Order.hasMany(IngredientUsage, { foreignKey: 'orderId' });
IngredientUsage.belongsTo(Order, { foreignKey: 'orderId' });

// MenuItem - IngredientUsage relationship
MenuItem.hasMany(IngredientUsage, { foreignKey: 'menuItemId' });
IngredientUsage.belongsTo(MenuItem, { foreignKey: 'menuItemId' });

// RecipeIngredient - IngredientUsage relationship
RecipeIngredient.hasMany(IngredientUsage, { foreignKey: 'recipeIngredientId' });
IngredientUsage.belongsTo(RecipeIngredient, { foreignKey: 'recipeIngredientId' });

// User relationships
User.hasMany(Attendance, { foreignKey: 'userId' });
Attendance.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Schedule, { foreignKey: 'userId' });
Schedule.belongsTo(User, { foreignKey: 'userId' });

// Attendance - Schedule relationship (một bản ghi chấm công liên kết với một lịch làm việc)
Attendance.belongsTo(Schedule, { 
  foreignKey: 'scheduleId',
  constraints: false // Không áp dụng ràng buộc khóa ngoại vì có thể có attendance mà không có schedule tương ứng
});

module.exports = {
  User,
  Table,
  MenuItem,
  Order,
  OrderItem,
  Review,
  Payment,
  Promotion,
  OrderPromotion,
  Salary,
  SalaryRate,
  SalaryDetail,
  Ingredient,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  RecipeIngredient,
  InventoryTransaction,
  KitchenPermission,
  IngredientPriceHistory,
  IngredientUsage,
  Attendance,
  Schedule,
  sequelize: require('../config/database')
}; 