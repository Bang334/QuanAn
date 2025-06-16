// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const menuRoutes = require('./routes/menu.routes');
const orderRoutes = require('./routes/order.routes');
const tableRoutes = require('./routes/table.routes');
const recipeRoutes = require('./routes/recipe.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const supplierRoutes = require('./routes/supplier.routes');
const reportRoutes = require('./routes/report.routes');
const paymentRoutes = require('./routes/payment.routes');
const promotionRoutes = require('./routes/promotion.routes');
const kitchenPermissionsRoutes = require('./routes/kitchen-permissions.routes');
const salaryRoutes = require('./routes/salary.routes');
const salaryRateRoutes = require('./routes/salaryRate.routes');
const reviewRoutes = require('./routes/review.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const scheduleRoutes = require('./routes/schedule.routes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/kitchen-permissions', kitchenPermissionsRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/salary-rates', salaryRateRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/schedule', scheduleRoutes); 